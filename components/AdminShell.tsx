import { accountsEnabled, currentAccount } from "@/lib/admin/accounts";
import AdminSignOut from "@/components/AdminSignOut";
import Link from "next/link";

import { redirect } from "next/navigation";

import AdminSidebarNav from "@/components/AdminSidebarNav";

import { isAdminAuthenticated } from "@/lib/admin/auth";

export default async function AdminLayout({
  children,
  loginNext = "/admin",
}: Readonly<{
  children: React.ReactNode;
  loginNext?: string;
}>) {
  const account = await currentAccount();
  if (accountsEnabled() && account && account.status !== "active")
    redirect("/admin/account");
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect(`/admin/login?next=${loginNext}`);
  }

  return (
    <div className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <div className="flex min-h-screen">
        <aside className="hidden w-52 shrink-0 border-r border-white/10 bg-[#050E17] lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-5 py-4">
            <Link
              href="/admin"
              className="text-xl font-semibold tracking-tight text-white"
            >
              BBA <span className="font-normal text-[#A9B5C3]">Club</span>
            </Link>

          </div>

          <AdminSidebarNav account={account} />

        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071422]">
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-2 lg:px-8">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="text-sm font-medium text-white lg:hidden"
                >
                  Admin
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {account && (
                  <span className="hidden text-xs text-[#A9B5C3] sm:inline">
                    {account.name}
                  </span>
                )}
                <Link
                  href="/admin/reset-password"
                  className="text-xs text-[#8EC5FF]"
                >
                  Password
                </Link>
                <AdminSignOut />
                <Link
                  href="/"
                  target="_blank"
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[#A9B5C3] transition hover:border-white/20 hover:text-white"
                >
                  View website
                </Link>
              </div>
            </div>

            <div className="border-t border-white/10 lg:hidden">
              <AdminSidebarNav account={account} />
            </div>
          </header>

          <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="mx-auto max-w-[1440px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
