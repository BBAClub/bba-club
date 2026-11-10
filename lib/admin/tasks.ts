import "server-only";
import { randomUUID } from "node:crypto";
import { client } from "@/sanity/lib/client";
import { listAccounts, readAccount } from "./accounts";
import { canAccess } from "./permissions";
import {
  priorities,
  statuses,
  type Fields,
  type Task,
  type TaskEvent,
  eventEligible,
} from "./task-types";

export class TaskError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function database() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error("Missing Sanity write token.");
  return client.withConfig({ token, perspective: "raw", useCdn: false });
}
export async function taskBoard() {
  const [tasks, events, accounts] = await Promise.all([
    database().fetch<Task[]>(
      `*[_type == "adminTask" && _id in path("internalTasks.*")] | order(_createdAt desc) {_id,_rev,_createdAt,title,description,"eventId":coalesce(eventId,""),assigneeId,dueDate,priority,status}`,
      {},
      { cache: "no-store" },
    ),
    client.fetch<TaskEvent[]>(
      `*[_type == "event" && defined(date)] | order(date asc, title asc) {_id,title,date}`,
      {},
      { cache: "no-store" },
    ),
    listAccounts(),
  ]);
  return {
    tasks,
    events,
    assignees: accounts
      .filter((account) => canAccess(account, "tasks"))
      .map(({ id, name }) => ({ id, name })),
    names: Object.fromEntries(accounts.map(({ id, name }) => [id, name])),
  };
}
function field(value: unknown, max: number, label: string) {
  if (typeof value !== "string" || value.length > max)
    throw new TaskError(`Invalid ${label}.`);
  return value.trim();
}
export async function saveTask(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new TaskError("Invalid request.");
  const body = input as Record<string, unknown>;
  const db = database();
  if (
    body.action !== "create" &&
    body.action !== "edit" &&
    body.action !== "move" &&
    body.action !== "delete"
  )
    throw new TaskError("Invalid action.");
  let existing: (Task & { _type: string }) | undefined;
  if (body.action !== "create") {
    if (
      typeof body.id !== "string" ||
      !/^internalTasks\.[a-f0-9-]{36}$/.test(body.id) ||
      typeof body.revision !== "string"
    )
      throw new TaskError("Invalid task.");
    existing = await db.getDocument<Task & { _type: string }>(body.id);
    if (!existing || existing._type !== "adminTask")
      throw new TaskError("Task not found.", 404);
    if (existing._rev !== body.revision)
      throw new TaskError("This task changed. Refresh and try again.", 409);
  }
  if (body.action === "delete" && existing) {
    const { _id, _rev } = existing;
    await db
      .transaction()
      .patch(_id, (patch) => patch.ifRevisionId(_rev).set({ deleting: true }))
      .delete(_id)
      .commit({ visibility: "sync" });
    return { deleted: _id };
  }
  if (typeof body.status !== "string" || !Object.hasOwn(statuses, body.status))
    throw new TaskError("Invalid status.");
  const status = body.status as Fields["status"];
  if (body.action === "move" && existing) {
    const updated = await db
      .patch(existing._id)
      .ifRevisionId(existing._rev)
      .set({ status })
      .commit({ visibility: "sync" });
    return {
      task: {
        ...existing,
        eventId: existing.eventId ?? "",
        status,
        _rev: updated._rev,
      },
    };
  }
  const title = field(body.title, 140, "title");
  const description = field(body.description, 4000, "description");
  const eventId = field(body.eventId, 128, "event");
  const assigneeId = field(body.assigneeId, 100, "assignee");
  const dueDate = field(body.dueDate, 10, "due date");
  if (!title) throw new TaskError("Enter a task title.");
  if (dueDate) {
    const date = new Date(dueDate + "T00:00:00Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== dueDate
    )
      throw new TaskError("Enter a valid due date.");
  }
  if (
    typeof body.priority !== "string" ||
    !Object.hasOwn(priorities, body.priority)
  )
    throw new TaskError("Invalid priority.");
  if (eventId && eventId !== existing?.eventId) {
    const event = /^[a-zA-Z0-9_-]+$/.test(eventId)
      ? await client.getDocument<TaskEvent>(eventId)
      : undefined;
    const created = existing ? new Date(existing._createdAt) : new Date();
    if (
      !event ||
      event._type !== "event" ||
      !event.date ||
      !eventEligible(event.date, created)
    ) {
      throw new TaskError(
        "Choose an upcoming event or one less than 14 days before the task was created.",
      );
    }
  }
  if (assigneeId && assigneeId !== existing?.assigneeId) {
    const account = await readAccount(assigneeId);
    if (!account || !canAccess(account, "tasks"))
      throw new TaskError("Choose an active member with Tasks access.");
  }
  const fields: Fields = {
    title,
    description,
    eventId,
    assigneeId,
    dueDate,
    priority: body.priority as Fields["priority"],
    status,
  };
  const saved = existing
    ? await db
        .patch(existing._id)
        .ifRevisionId(existing._rev)
        .set(fields)
        .commit({ visibility: "sync" })
    : await db.create(
        { _id: `internalTasks.${randomUUID()}`, _type: "adminTask", ...fields },
        { visibility: "sync" },
      );
  return {
    task: {
      ...fields,
      _id: saved._id,
      _rev: saved._rev,
      _createdAt: saved._createdAt,
    },
  };
}

export async function upcomingAssignedTasks(assigneeId: string) {
  return database().fetch<Pick<Task, "_id" | "title" | "dueDate" | "status">[]>(
    `*[_type == "adminTask" && _id in path("internalTasks.*") && assigneeId == $assigneeId && status != "done" && defined(dueDate) && dueDate != ""] | order(dueDate asc)[0...5] {_id,title,dueDate,status}`,
    { assigneeId },
    { cache: "no-store" },
  );
}

export async function openTasksForEvent(eventId: string) {
  return database().fetch<
    Pick<Task, "_id" | "title" | "dueDate" | "status" | "assigneeId">[]
  >(
    `*[_type == "adminTask" && _id in path("internalTasks.*") && eventId == $eventId && status != "done"] | order(select(defined(dueDate) && dueDate != "" => 0, 1) asc, dueDate asc, _createdAt desc) {_id,title,dueDate,status,assigneeId}`,
    { eventId },
    { cache: "no-store" },
  );
}
