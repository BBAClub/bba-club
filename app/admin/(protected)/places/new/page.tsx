import Link from "next/link";

import AdminPlaceForm from "@/components/AdminPlaceForm";

export const dynamic =
  "force-dynamic";

export default function NewPlacePage() {
  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/places"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#71869A] transition hover:text-white"
        >
          ← Back to places
        </Link>

        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8EC5FF]">
          Places
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white md:text-5xl">
          Add place
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8EA0B3]">
          Add a new recommendation to Explore Prague.
        </p>
      </div>

      <div className="max-w-5xl">
        <AdminPlaceForm />
      </div>
    </div>
  );
}
