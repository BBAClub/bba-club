import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import AdminSidebarNav from "@/components/AdminSidebarNav";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const dynamic =
  "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    redirect(
      "/admin/login?next=/admin"
    );
  }

  return (
    <div className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#050E17] lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link
              href="/admin"
              className="text-xl font-semibold tracking-tight text-white"
            >
              BBA{" "}
              <span className="font-normal text-[#A9B5C3]">
                Club
              </span>
            </Link>

            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#53687D]">
              Admin
            </p>
          </div>

          <AdminSidebarNav />

          <div className="border-t border-white/10 px-6 py-5">
            <p className="text-xs text-[#53687D]">
              BBA Club internal
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071422]/90 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-5 lg:px-8">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="text-sm font-medium text-white lg:pointer-events-none"
                >
                  BBA Club Admin
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  target="_blank"
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[#A9B5C3] transition hover:border-white/20 hover:text-white"
                >
                  View website
                </Link>
              </div>
            </div>

            <div className="lg:hidden [&>nav]:hidden">
              <AdminSidebarNav />
            </div>
          </header>

          <main className="px-5 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1600px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
