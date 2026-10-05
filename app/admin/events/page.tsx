import {
  redirect,
} from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import EventDashboardClient from "@/components/EventDashboardClient";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const dynamic =
  "force-dynamic";

export default async function EventDashboardPage() {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    redirect(
      "/admin/login?next=/admin/events"
    );
  }

  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      <section className="px-5 py-10 md:px-8 md:py-14">
        <EventDashboardClient />
      </section>

      <Footer />
    </main>
  );
}