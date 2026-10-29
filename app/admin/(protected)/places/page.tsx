import Link from "next/link";

import AdminPlacesList, {
  type AdminPlaceListItem,
} from "@/components/AdminPlacesList";

import {
  client,
} from "@/sanity/lib/client";

export const dynamic =
  "force-dynamic";

const ADMIN_PLACES_QUERY = `
  *[_type == "place"]
  | order(name asc) {
    _id,
    name,
    category,
    area,
    address,
    price,
    symbol,
    partner,
    promoCode,

    "coverImageUrl":
      coverImage.asset->url
  }
`;

export default async function PlacesPage() {
  const places =
    await client.fetch<
      AdminPlaceListItem[]
    >(
      ADMIN_PLACES_QUERY
    );

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8EC5FF]">
            Places
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white md:text-5xl">
            Prague guide
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8EA0B3]">
            Manage places shown in
            Explore Prague.
          </p>
        </div>

        <Link
          href="/admin/places/new"
          className="inline-flex items-center justify-center rounded-xl bg-[#0057FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2874FF]"
        >
          + Add place
        </Link>
      </div>

      <AdminPlacesList
        places={places}
      />
    </div>
  );
}
