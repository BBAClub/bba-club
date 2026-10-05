import {
  Suspense,
} from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import CancelRegistrationClient from "@/components/CancelRegistrationClient";

export const dynamic =
  "force-dynamic";

export default function CancelRegistrationPage() {
  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      <section className="px-5 py-12 md:px-8 md:py-20">
        <Suspense
          fallback={
            <div className="mx-auto max-w-xl rounded-[26px] border border-white/10 bg-[#0D1D2C] p-7 text-center text-[#8EA0B3]">
              Loading registration...
            </div>
          }
        >
          <CancelRegistrationClient />
        </Suspense>
      </section>

      <Footer />
    </main>
  );
}