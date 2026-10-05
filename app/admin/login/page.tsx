import {
  Suspense,
} from "react";

import {
  redirect,
} from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import AdminLoginClient from "@/components/AdminLoginClient";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const dynamic =
  "force-dynamic";

export default async function AdminLoginPage() {
  const authenticated =
    await isAdminAuthenticated();

  if (authenticated) {
    redirect(
      "/admin/events"
    );
  }

  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      <section className="px-5 py-14 md:px-8 md:py-24">
        <Suspense
          fallback={
            <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#0D1D2C] p-8 text-center text-[#71869A]">
              Loading...
            </div>
          }
        >
          <AdminLoginClient />
        </Suspense>
      </section>

      <Footer />
    </main>
  );
}