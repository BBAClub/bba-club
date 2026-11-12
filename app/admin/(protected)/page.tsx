import { Suspense } from "react";
import { upcomingAssignedTasks } from "@/lib/admin/tasks";
import { pragueDate, statuses } from "@/lib/admin/task-types";
import { DraftLink, Panel } from "@/components/AdminSectionDraft";
import { currentAccount } from "@/lib/admin/accounts";
import { canAccess, permissionForPath } from "@/lib/admin/permissions";
import Link from "next/link";

export const dynamic =
  "force-dynamic";

const quickActions = [
  {
    title: "Create event",
    description:
      "Create and publish a new BBA Club event.",
    href: "/admin/events",
    symbol: "+",
  },
  {
    title: "Manage registrations",
    description:
      "View attendees, waitlists and check-in.",
    href: "/admin/registrations",
    symbol: "◎",
  },
  {
    title: "Add place",
    description:
      "Add a new place to Explore Prague.",
    href: "/admin/places/new",
    symbol: "⌖",
  },
  {
    title: "View submissions",
    description:
      "See incoming Study Hub materials.",
    href: "/admin/study",
    symbol: "▤",
  },
];

const sections = [
  {
    title: "Events",
    description:
      "Create events, manage registrations, capacity and check-in.",
    href: "/admin/events",
    status: "Available",
  },
  {
    title: "Tasks",
    description:
      "Kanban board for events, assignments and deadlines.",
    href: "/admin/tasks",
    status: "Available",
  },
  {
    title: "Places",
    description:
      "Manage Explore Prague places, partners and promo codes.",
    href: "/admin/places",
    status: "Available",
  },
  {
    title: "Study",
    description:
      "See submissions and Study Hub resources.",
    href: "/admin/study",
    status: "Draft",
  },
  {
    title: "Communications",
    description:
      "Monitor automatic registration email delivery.",
    href: "/admin/communications",
    status: "Draft",
  },
  {
    title: "Finance",
    description:
      "Payments, refunds and event finances.",
    href: "/admin/finance",
    status: "Draft",
  },
  {
    title: "Wiki",
    description:
      "Internal BBA Club documentation and procedures.",
    href: "/admin/wiki",
    status: "Draft",
  },
  {
    title: "Team",
    description:
      "Team members, roles and access.",
    href: "/admin/team",
    status: "Draft",
  },
  {
    title: "Settings",
    description: "Review your account and section access.",
    href: "/admin/settings",
    status: "Draft",
  },
];

async function MyTasks({ assigneeId }: { assigneeId: string }) {
  const myTasks = await upcomingAssignedTasks(assigneeId).catch(() => null);
  const today = pragueDate();

  if (!myTasks) {
    return <DraftLink href="/admin/tasks?view=mine">Couldn’t load tasks. Open the board →</DraftLink>;
  }

  return (
    <>
      {myTasks.length ? <ul className="divide-y divide-white/10 text-sm">
        {myTasks.map(task => <li key={task._id} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <DraftLink href={`/admin/tasks?task=${encodeURIComponent(task._id)}`}>{task.title}</DraftLink>
          <span className={task.dueDate < today ? "text-red-300" : "text-[#A9B5C3]"}>
            {statuses[task.status]} · {task.dueDate < today ? "Overdue · " : ""}<time dateTime={task.dueDate}>{task.dueDate}</time>
          </span>
        </li>)}
      </ul> : <p className="text-sm text-[#A9B5C3]">No open tasks with a deadline assigned to you.</p>}
      <DraftLink href="/admin/tasks?view=mine">Open my tasks on the board</DraftLink>
    </>
  );
}

export default async function AdminDashboardPage() {
  const account = await currentAccount();
  const showTasks = account && canAccess(account, "tasks");
  const visible = (href: string) => {
    const permission = permissionForPath(href);
    return !account || (permission !== "users" && canAccess(account, permission));
  };
  return (
    <div>
      {account && <p className="mb-5 text-sm text-[#A9B5C3]">Signed in as {account.name} · {account.email}{account.role === "administrator" ? " · Administrator" : ""}</p>}
      {account?.role === "administrator" && <Link href="/admin/users" className="mb-5 inline-block rounded-xl bg-[#0057FF] px-4 py-3 text-sm font-semibold">Manage accounts & access</Link>}
      {account?.role === "member" && account.permissions.length === 0 && <p className="mb-5 rounded-xl border border-white/10 p-4 text-sm text-[#A9B5C3]">Your account is approved. Ask an administrator to assign access to the sections you need.</p>}
      {showTasks && <div className="my-6">
        <Panel title="My tasks">
          <Suspense fallback={<p role="status" className="text-sm text-[#A9B5C3]">Loading your tasks…</p>}>
            <MyTasks assigneeId={account.id} />
          </Suspense>
        </Panel>
      </div>}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8EC5FF]">
            BBA Club internal
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white md:text-5xl">
            Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8EA0B3]">
            Manage events, people, content and internal
            BBA Club operations from one place.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="w-fit rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-[#A9B5C3] transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          Open public website →
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#71869A]">
              Quick actions
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Get things done
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.filter((item) => visible(item.href)).map(
            (action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-[22px] border border-white/10 bg-[#0D1D2C] p-5 transition hover:-translate-y-0.5 hover:border-[#0057FF]/50 hover:bg-[#102235]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0057FF]/10 text-lg font-semibold text-[#5790FF] transition group-hover:bg-[#0057FF] group-hover:text-white">
                  {action.symbol}
                </div>

                <h3 className="mt-5 font-semibold text-white">
                  {action.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#71869A]">
                  {action.description}
                </p>
              </Link>
            )
          )}
        </div>
      </section>

      <section className="mt-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#71869A]">
            Workspace
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            BBA Club Admin
          </h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.filter((item) => visible(item.href)).map(
            (section) => (
              <Link
                key={section.title}
                href={section.href}
                className="group rounded-[22px] border border-white/10 bg-[#0B1A29] p-5 transition hover:border-white/20 hover:bg-[#0D1D2C]"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-semibold text-white">
                    {section.title}
                  </h3>

                  <span
                    className={
                      section.status ===
                      "Available"
                        ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-300"
                        : "rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#71869A]"
                    }
                  >
                    {section.status}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#71869A]">
                  {section.description}
                </p>

                <div className="mt-5 text-xs font-semibold text-[#5790FF] opacity-70 transition group-hover:opacity-100">
                  Open →
                </div>
              </Link>
            )
          )}
        </div>
      </section>

      <section className="mt-10 rounded-[24px] border border-[#0057FF]/20 bg-[#0057FF]/[0.06] p-6">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8EC5FF]">
            Admin development
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Building the BBA Club workspace
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#8EA0B3]">
            Events, registrations and Places are already
            connected. Next we will gradually add Study Hub,
            Tasks, Wiki, communications, payments and team
            management.
          </p>
        </div>
      </section>
    </div>
  );
}
