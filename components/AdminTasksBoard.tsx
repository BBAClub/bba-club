"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  priorities,
  statuses,
  type Fields,
  type TaskEvent,
  eventEligible,
  pragueDate,
  type Task,
} from "@/lib/admin/task-types";

const control =
  "w-full rounded-lg border border-white/15 bg-[#071422] px-3 py-2 text-sm text-white";
const button =
  "min-h-10 rounded-md bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0048D8] disabled:opacity-50";
const columns = Object.entries(statuses) as [Fields["status"], string][];
const empty: Fields = {
  title: "",
  description: "",
  eventId: "",
  assigneeId: "",
  dueDate: "",
  priority: "normal",
  status: "todo",
};

export default function AdminTasksBoard({
  tasks: initialTasks,
  events,
  assignees,
  names,
  currentId,
  initialMine = false,
  initialTask,
  initialEvent,
  startCreating = false,
}: {
  tasks: Task[];
  events: TaskEvent[];
  assignees: { id: string; name: string }[];
  names: Record<string, string>;
  currentId: string;
  initialMine?: boolean;
  initialTask?: string;
  initialEvent?: string;
  startCreating?: boolean;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const storageKey = `bba-tasks-filters:${currentId}`;
  const hasPreset = !!(initialTask || initialEvent || initialMine);
  const [filters, setFilters] = useState({
    eventFilter: initialEvent || "",
    person: initialMine ? currentId : "",
    priority: "",
    deadline: "",
  });
  const { eventFilter, person, priority, deadline } = filters;
  const [draft, setDraft] = useState<Fields | Task | null>(
    () =>
      initialTasks.find((task) => task._id === initialTask) ??
      (startCreating ? { ...empty, eventId: initialEvent || "" } : null),
  );
  const [linkMessage, setLinkMessage] = useState("");

  useEffect(() => {
    if (hasPreset) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (!stored) return;
        setFilters({
          eventFilter:
            stored.eventFilter === "none" ||
            events.some(
              (item) =>
                item._id === stored.eventFilter &&
                (eventEligible(item.date, new Date()) ||
                  initialTasks.some((task) => task.eventId === item._id)),
            )
              ? stored.eventFilter
              : "",
          person:
            stored.person === "none" ||
            stored.person === currentId ||
            assignees.some((member) => member.id === stored.person) ||
            (Object.hasOwn(names, stored.person) &&
              initialTasks.some((task) => task.assigneeId === stored.person))
              ? stored.person
              : "",
          priority: Object.hasOwn(priorities, stored.priority)
            ? stored.priority
            : "",
          deadline: ["none", "overdue", "soon"].includes(stored.deadline)
            ? stored.deadline
            : "",
        });
      } catch {
        /* Storage can be unavailable. */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    storageKey,
    hasPreset,
    events,
    names,
    initialTasks,
    assignees,
    currentId,
  ]);

  function updateFilters(next: typeof filters) {
    setFilters(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* Storage can be unavailable. */
    }
  }

  async function copyTaskLink(task: Task) {
    const url = new URL("/admin/tasks", window.location.origin);
    url.searchParams.set("task", task._id);
    try {
      await navigator.clipboard.writeText(url.href);
      setLinkMessage("Link copied.");
    } catch {
      setLinkMessage(url.href);
    }
  }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<Fields["status"] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const today = pragueDate();
  const end = new Date(today + "T00:00:00Z");
  end.setUTCDate(end.getUTCDate() + 7);
  const soon = end.toISOString().slice(0, 10);
  const visible = tasks.filter(
    (task) =>
      (!eventFilter ||
        (eventFilter === "none"
          ? !task.eventId
          : task.eventId === eventFilter)) &&
      (!person ||
        (person === "none" ? !task.assigneeId : task.assigneeId === person)) &&
      (!priority || task.priority === priority) &&
      (!deadline ||
        (deadline === "none"
          ? !task.dueDate
          : task.status !== "done" &&
            !!task.dueDate &&
            (deadline === "overdue"
              ? task.dueDate < today
              : task.dueDate >= today && task.dueDate <= soon))),
  );

  async function mutate(body: object) {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        error?: string;
        task?: Task;
        deleted?: string;
      };
      if (!response.ok)
        throw new Error(result.error || "Could not save changes.");
      if (result.task) {
        const saved = result.task;
        setTasks((items) =>
          items.some((task) => task._id === saved._id)
            ? items.map((task) => (task._id === saved._id ? saved : task))
            : [saved, ...items],
        );
      }
      if (result.deleted)
        setTasks((items) =>
          items.filter((task) => task._id !== result.deleted),
        );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  function openTask(task: Fields | Task) {
    setDraft(task);
    setLinkMessage("");
    setConfirmDelete(false);
    setError("");
  }
  function newTask(status: Fields["status"] = "todo") {
    openTask({
      ...empty,
      status,
      eventId: events.some(
        (item) =>
          item._id === eventFilter && eventEligible(item.date, new Date()),
      )
        ? eventFilter
        : "",
      assigneeId: assignees.some((item) => item.id === person) ? person : "",
    });
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const body =
      "_id" in draft
        ? { ...draft, action: "edit", id: draft._id, revision: draft._rev }
        : { ...draft, action: "create" };
    if (await mutate(body)) setDraft(null);
  }
  function move(task: Task, status: Fields["status"]) {
    if (status !== task.status)
      void mutate({
        action: "move",
        id: task._id,
        revision: task._rev,
        status,
      });
  }
  function assigneeLabel(id: string) {
    return names[id] || "Former member";
  }
  const created =
    draft && "_createdAt" in draft ? new Date(draft._createdAt) : new Date();
  const filterEvents = events.filter(
    (item) =>
      item._id === initialEvent ||
      eventEligible(item.date, new Date()) ||
      tasks.some((task) => task.eventId === item._id),
  );
  function eventOptions(options: TaskEvent[]) {
    return options.map((item) => (
      <option key={item._id} value={item._id}>
        {item.title} · {item.date}
      </option>
    ));
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#8EC5FF]">
            Team workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold">Tasks</h1>
          <p className="mt-2 text-sm text-[#A9B5C3]">
            Plan event work and track team tasks from backlog to done.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={button} disabled={busy} onClick={() => newTask()}>
            New task
          </button>
        </div>
      </header>
      <div className="grid gap-3 border-y border-white/15 py-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-xs">
          Event
          <select
            className={control}
            value={eventFilter}
            onChange={(e) =>
              updateFilters({ ...filters, eventFilter: e.target.value })
            }
          >
            <option value="">All events</option>
            <option value="none">No event</option>
            {eventOptions(filterEvents)}
          </select>
        </label>
        <label className="space-y-1 text-xs">
          Assignee
          <select
            className={control}
            value={person}
            onChange={(e) =>
              updateFilters({ ...filters, person: e.target.value })
            }
          >
            <option value="">Everyone</option>
            <option value={currentId}>My tasks</option>
            <option value="none">Unassigned</option>
            {Object.entries(names)
              .filter(
                ([id]) =>
                  id !== currentId &&
                  (assignees.some((member) => member.id === id) ||
                    tasks.some((task) => task.assigneeId === id)),
              )
              .map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
          </select>
        </label>
        <label className="space-y-1 text-xs">
          Priority
          <select
            className={control}
            value={priority}
            onChange={(e) =>
              updateFilters({ ...filters, priority: e.target.value })
            }
          >
            <option value="">Any priority</option>
            {Object.entries(priorities).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs">
          Due date
          <select
            className={control}
            value={deadline}
            onChange={(e) =>
              updateFilters({ ...filters, deadline: e.target.value })
            }
          >
            <option value="">Any date</option>
            <option value="overdue">Overdue</option>
            <option value="soon">Due in the next 7 days</option>
            <option value="none">No due date</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={() =>
          updateFilters({
            eventFilter: "",
            person: "",
            priority: "",
            deadline: "",
          })
        }
        className="text-sm text-[#8EC5FF] hover:underline"
      >
        Reset filters
      </button>
      {initialTask &&
        !initialTasks.some((task) => task._id === initialTask) && (
          <p role="status" className="text-sm text-[#A9B5C3]">
            This task is no longer available.
          </p>
        )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      {draft && (
        <form
          className="max-w-4xl space-y-4 border-b border-white/15 pb-5"
          onSubmit={submit}
        >
          <h2 className="font-semibold">
            {"_id" in draft ? "Edit task" : "New task"}
          </h2>
          {"_id" in draft && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <button
                type="button"
                className="text-[#8EC5FF] hover:underline"
                onClick={() => void copyTaskLink(draft)}
              >
                Copy task link
              </button>
              {linkMessage && (
                <span role="status" className="break-all text-[#A9B5C3]">
                  {linkMessage}
                </span>
              )}
            </div>
          )}

          <label className="block space-y-1 text-sm">
            Title
            <input
              className={control}
              required
              autoFocus
              maxLength={140}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            Description
            <textarea
              className={control}
              rows={3}
              maxLength={4000}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1 text-sm">
              Event
              <select
                className={control}
                value={draft.eventId}
                onChange={(e) =>
                  setDraft({ ...draft, eventId: e.target.value })
                }
              >
                <option value="">No event</option>
                {draft.eventId &&
                  !events.some((item) => item._id === draft.eventId) && (
                    <option value={draft.eventId}>Unavailable event</option>
                  )}
                {eventOptions(
                  events.filter(
                    (item) =>
                      item._id === draft.eventId ||
                      eventEligible(item.date, created),
                  ),
                )}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              Assignee
              <select
                className={control}
                value={draft.assigneeId}
                onChange={(e) =>
                  setDraft({ ...draft, assigneeId: e.target.value })
                }
              >
                <option value="">Unassigned</option>
                {draft.assigneeId &&
                  !assignees.some((item) => item.id === draft.assigneeId) && (
                    <option value={draft.assigneeId}>
                      {assigneeLabel(draft.assigneeId)} (no Tasks access)
                    </option>
                  )}
                {assignees.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.id === currentId ? " (you)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              Due date
              <input
                type="date"
                className={control}
                value={draft.dueDate}
                onChange={(e) =>
                  setDraft({ ...draft, dueDate: e.target.value })
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              Priority
              <select
                className={control}
                value={draft.priority}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    priority: e.target.value as Fields["priority"],
                  })
                }
              >
                {Object.entries(priorities).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              Status
              <select
                className={control}
                value={draft.status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    status: e.target.value as Fields["status"],
                  })
                }
              >
                {columns.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className={button} disabled={busy}>
              Save task
            </button>
            <button
              type="button"
              className="text-sm"
              disabled={busy}
              onClick={() => setDraft(null)}
            >
              Cancel
            </button>
            {"_id" in draft && (
              <button
                type="button"
                className="ml-auto text-sm text-red-300"
                disabled={busy}
                onClick={async () => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  if (
                    await mutate({
                      action: "delete",
                      id: draft._id,
                      revision: draft._rev,
                    })
                  )
                    setDraft(null);
                }}
              >
                {confirmDelete ? "Confirm deletion" : "Delete task"}
              </button>
            )}
          </div>
        </form>
      )}
      <p className="text-sm text-[#A9B5C3]">
        {visible.length} of {tasks.length} tasks
      </p>
      <div className="grid auto-cols-[minmax(225px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4">
        {columns.map(([status, label]) => {
          const cards = visible.filter((task) => task.status === status);
          return (
            <section
              key={status}
              aria-label={label}
              className={`min-h-64 rounded-2xl border bg-[#0B1A29] p-3 ${target === status ? "border-blue-400" : "border-white/10"}`}
              onDragOver={(event) => {
                if (dragging && !busy) {
                  event.preventDefault();
                  setTarget(status);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const task = tasks.find((item) => item._id === dragging);
                setTarget(null);
                setDragging(null);
                if (task) move(task, status);
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">
                  {label}{" "}
                  <span className="ml-1 text-[#A9B5C3]">{cards.length}</span>
                </h2>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Add task to ${label}`}
                  className="rounded px-2 text-lg text-[#8EC5FF]"
                  onClick={() => newTask(status)}
                >
                  +
                </button>
              </div>
              {cards.length === 0 && (
                <p className="p-3 text-xs text-[#A9B5C3]">No tasks here.</p>
              )}
              <div className="space-y-3">
                {cards.map((task) => (
                  <article
                    key={task._id}
                    draggable={!busy}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", task._id);
                      event.dataTransfer.effectAllowed = "move";
                      setDragging(task._id);
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setTarget(null);
                    }}
                    className="space-y-2 rounded-xl border border-white/10 bg-[#122638] p-3"
                  >
                    <button
                      type="button"
                      disabled={busy}
                      className="block w-full break-words text-left text-sm font-semibold hover:text-[#8EC5FF]"
                      onClick={() => openTask(task)}
                    >
                      {task.title}
                    </button>
                    {task.description && (
                      <p className="line-clamp-2 whitespace-pre-wrap break-words text-xs text-[#A9B5C3]">
                        {task.description}
                      </p>
                    )}
                    <p className="text-xs text-[#A9B5C3]">
                      {events.find((item) => item._id === task.eventId)
                        ?.title ||
                        (task.eventId ? "Unavailable event" : "No event")}{" "}
                      · {priorities[task.priority]}
                    </p>
                    <p className="text-xs text-[#A9B5C3]">
                      {task.assigneeId
                        ? assigneeLabel(task.assigneeId)
                        : "Unassigned"}
                    </p>
                    {task.dueDate && (
                      <p
                        className={`text-xs ${task.status !== "done" && task.dueDate < today ? "text-red-300" : "text-[#A9B5C3]"}`}
                      >
                        {task.status !== "done" && task.dueDate < today
                          ? "Overdue · "
                          : "Due · "}
                        <time dateTime={task.dueDate}>{task.dueDate}</time>
                      </p>
                    )}
                    <select
                      aria-label={`Status for ${task.title}`}
                      disabled={busy}
                      className={control + " !text-xs"}
                      value={task.status}
                      onChange={(e) =>
                        move(task, e.target.value as Fields["status"])
                      }
                    >
                      {columns.map(([key, name]) => (
                        <option key={key} value={key}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
