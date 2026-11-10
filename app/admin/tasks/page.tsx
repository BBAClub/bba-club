import AdminShell from "@/components/AdminShell";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/admin/accounts";
import { canAccess } from "@/lib/admin/permissions";
import { eventEligible } from "@/lib/admin/task-types";
import { taskBoard } from "@/lib/admin/tasks";
import AdminTasksBoard from "@/components/AdminTasksBoard";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    task?: string;
    event?: string;
    create?: string;
  }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["task", "event", "view", "create"] as const) {
    if (typeof params[key] === "string") query.set(key, params[key]);
  }
  const next = query.size ? `/admin/tasks?${query}` : "/admin/tasks";
  const account = await currentAccount();
  if (!account) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  if (account.status !== "active") redirect("/admin/account");
  if (!canAccess(account, "tasks")) redirect("/admin?access=denied");
  const board = await taskBoard();
  const event = board.events.find((item) => item._id === params.event);
  const create =
    params.create === "1" && event && eventEligible(event.date, new Date());
  return (
    <AdminShell loginNext={encodeURIComponent(next)}>
      <AdminTasksBoard
        key={JSON.stringify([
          params.view,
          params.task,
          params.event,
          params.create,
        ])}
        {...board}
        currentId={account.id}
        initialMine={params.view === "mine"}
        initialTask={params.task}
        initialEvent={event?._id}
        startCreating={!!create}
      />
    </AdminShell>
  );
}
