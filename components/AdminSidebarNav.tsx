"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

const navigation = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "⌂",
  },
  {
    href: "/admin/tasks",
    label: "Tasks",
    icon: "✓",
  },
  {
    href: "/admin/events",
    label: "Events",
    icon: "◫",
  },
  {
    href: "/admin/registrations",
    label: "Registrations",
    icon: "◎",
  },
  {
    href: "/admin/places",
    label: "Places",
    icon: "⌖",
  },
  {
    href: "/admin/study",
    label: "Study",
    icon: "▤",
  },
  {
    href: "/admin/communications",
    label: "Communications",
    icon: "✉",
  },
  {
    href: "/admin/finance",
    label: "Finance",
    icon: "◈",
  },
  {
    href: "/admin/wiki",
    label: "Wiki",
    icon: "▧",
  },
  {
    href: "/admin/team",
    label: "Team",
    icon: "◉",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: "⚙",
  },
];

function isActivePath(
  pathname: string,
  href: string
) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

export default function AdminSidebarNav() {
  const pathname =
    usePathname();

  return (
    <>
      <nav className="flex-1 space-y-1 px-3 py-5">
        {navigation.map(
          (item) => {
            const active =
              isActivePath(
                pathname,
                item.href
              );

            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                className={
                  active
                    ? "flex items-center gap-3 rounded-xl bg-[#0057FF]/10 px-3 py-2.5 text-sm font-medium text-white"
                    : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#A9B5C3] transition hover:bg-white/[0.06] hover:text-white"
                }
              >
                <span
                  className={
                    active
                      ? "flex h-7 w-7 items-center justify-center rounded-lg bg-[#0057FF] text-sm text-white"
                      : "flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-sm text-[#71869A]"
                  }
                >
                  {
                    item.icon
                  }
                </span>

                <span>
                  {
                    item.label
                  }
                </span>
              </Link>
            );
          }
        )}
      </nav>

      <div className="overflow-x-auto border-t border-white/5 px-4 py-2 lg:hidden">
        <nav className="flex min-w-max gap-1">
          {navigation.map(
            (item) => {
              const active =
                isActivePath(
                  pathname,
                  item.href
                );

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className={
                    active
                      ? "rounded-lg bg-[#0057FF]/10 px-3 py-2 text-xs font-semibold text-[#8EC5FF]"
                      : "rounded-lg px-3 py-2 text-xs font-medium text-[#8EA0B3] transition hover:bg-white/[0.06] hover:text-white"
                  }
                >
                  {
                    item.label
                  }
                </Link>
              );
            }
          )}
        </nav>
      </div>
    </>
  );
}
