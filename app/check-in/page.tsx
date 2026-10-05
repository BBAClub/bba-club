import {
  redirect,
} from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import CheckInClient from "@/components/CheckInClient";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const dynamic =
  "force-dynamic";

export default async function CheckInPage() {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    redirect(
      "/admin/login?next=/check-in"
    );
  }

  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      <section className="px-5 py-10 md:px-8 md:py-14">
        <CheckInClient />
      </section>

      <Footer />
    </main>
  );
}