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
    href: "/admin/events",
    symbol: "◎",
  },
  {
    title: "Add place",
    description:
      "Add a new place to Explore Prague.",
    href: "/admin/places",
    symbol: "⌖",
  },
  {
    title: "Review submissions",
    description:
      "Approve or reject Study Hub materials.",
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
      "Kanban board for projects, events and internal work.",
    href: "/admin/tasks",
    status: "Coming soon",
  },
  {
    title: "Places",
    description:
      "Manage Explore Prague places, partners and promo codes.",
    href: "/admin/places",
    status: "Coming soon",
  },
  {
    title: "Study",
    description:
      "Review submissions and manage Study Hub resources.",
    href: "/admin/study",
    status: "Coming soon",
  },
  {
    title: "Communications",
    description:
      "Email attendees and monitor delivery status.",
    href: "/admin/communications",
    status: "Coming soon",
  },
  {
    title: "Finance",
    description:
      "Payments, refunds and event finances.",
    href: "/admin/finance",
    status: "Coming soon",
  },
  {
    title: "Wiki",
    description:
      "Internal BBA Club documentation and procedures.",
    href: "/admin/wiki",
    status: "Coming soon",
  },
  {
    title: "Team",
    description:
      "Team members, roles and access.",
    href: "/admin/team",
    status: "Coming soon",
  },
];

export default function AdminDashboardPage() {
  return (
    <div>
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
          {quickActions.map(
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
          {sections.map(
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
            Events are already connected. Next we will
            gradually add registrations, Places, Study Hub,
            Tasks, Wiki, communications, payments and team
            management.
          </p>
        </div>
      </section>
    </div>
  );
}
