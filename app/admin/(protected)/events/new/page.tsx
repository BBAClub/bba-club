import Link from "next/link";

import AdminEventForm from "@/components/AdminEventForm";

export const dynamic =
  "force-dynamic";

export default function NewEventPage() {
  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#71869A] transition hover:text-white"
        >
          ← Back to events
        </Link>

        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8EC5FF]">
          Events
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white md:text-5xl">
          Create event
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8EA0B3]">
          Create a new BBA Club event and configure
          registration, capacity and payment settings.
        </p>
      </div>

      <div className="max-w-5xl">
        <AdminEventForm />
      </div>
    </div>
  );
}
