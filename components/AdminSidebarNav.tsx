"use client";

import Link from "next/link";
import { canAccess, permissionForPath, type AdminAccount } from "@/lib/admin/permissions";

import {
  usePathname,
} from "next/navigation";

const navigation = [
  {
    href: "/admin",
    label: "Dashboard",
  },
  {
    href: "/admin/tasks",
    label: "Tasks",
  },
  {
    href: "/admin/events",
    label: "Events",
  },
  {
    href: "/admin/registrations",
    label: "Registrations",
  },
  {
    href: "/admin/places",
    label: "Places",
  },
  {
    href: "/admin/study",
    label: "Study",
  },
  {
    href: "/admin/communications",
    label: "Communications",
  },
  {
    href: "/admin/finance",
    label: "Finance",
  },
  {
    href: "/admin/wiki",
    label: "Wiki",
  },
  {
    href: "/admin/team",
    label: "Team",
  },
  {
    href: "/admin/settings",
    label: "Settings",
  },
];

navigation.push({ href: "/admin/check-in", label: "Check-in" });
navigation.push({ href: "/admin/users", label: "Access & accounts" });

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

export default function AdminSidebarNav({ account }: { account?: AdminAccount | null }) {
  const visibleNavigation = navigation.filter((item) => {
    const permission = permissionForPath(item.href);
    if (permission === "users") return account?.role === "administrator";
    return !account || canAccess(account, permission);
  });
  const pathname =
    usePathname();

  return (
    <nav aria-label="Admin navigation"
      className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:overflow-visible lg:px-3 lg:py-4">
      {visibleNavigation.map(item => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link key={item.href} href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 shrink-0 items-center rounded-md px-3 text-sm ${
              active
                ? "bg-[#0057FF]/15 font-semibold text-[#B8D8FF]"
                : "text-[#A9B5C3] hover:bg-white/5 hover:text-white"
            }`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
