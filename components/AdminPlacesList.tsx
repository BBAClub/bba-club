"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

export type AdminPlaceListItem = {
  _id: string;

  name?: string;
  category?: string;
  area?: string;
  address?: string;

  price?: string;
  symbol?: string;

  partner?: boolean;
  promoCode?: string;

  coverImageUrl?: string;
};

const categories = [
  "All",
  "Cafés",
  "Food",
  "Study",
  "Nightlife",
  "Outdoors",
];

export default function AdminPlacesList({
  places,
}: {
  places:
    AdminPlaceListItem[];
}) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState("All");

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return places.filter(
        (place) => {
          const matchesCategory =
            category === "All" ||
            place.category ===
              category;

          const matchesSearch =
            !query ||
            [
              place.name,
              place.area,
              place.address,
              place.category,
            ]
              .filter(Boolean)
              .some(
                (value) =>
                  value!
                    .toLowerCase()
                    .includes(
                      query
                    )
              );

          return (
            matchesCategory &&
            matchesSearch
          );
        }
      );
    }, [
      places,
      search,
      category,
    ]);

  const partnerCount =
    places.filter(
      (place) =>
        place.partner
    ).length;

  return (
    <>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
            Places
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {places.length}
          </p>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
            BBA partners
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {partnerCount}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search places..."
            className="rounded-xl border border-white/10 bg-[#0B1A29] px-4 py-3 text-sm text-white outline-none placeholder:text-[#53687D] focus:border-[#0057FF]"
          />

          <select
            value={category}
            onChange={(
              event
            ) =>
              setCategory(
                event.target.value
              )
            }
            className="rounded-xl border border-white/10 bg-[#0B1A29] px-4 py-3 text-sm text-white outline-none focus:border-[#0057FF]"
          >
            {categories.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>
        </div>

        <p className="mt-5 text-xs text-[#71869A]">
          {filtered.length} places
        </p>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {filtered.map(
            (place) => (
              <Link
                key={place._id}
                href={`/admin/places/${encodeURIComponent(
                  place._id
                )}`}
                className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0B1A29] transition hover:border-[#0057FF]/50"
              >
                <div className="grid h-full grid-cols-[110px_1fr] sm:grid-cols-[160px_1fr]">
                  <div className="flex min-h-36 items-center justify-center overflow-hidden bg-[#091725]">
                    {place.coverImageUrl ? (
                      <img
                        src={
                          place.coverImageUrl
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">
                        {place.symbol ??
                          "📍"}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-white">
                        {place.symbol}{" "}
                        {place.name}
                      </h2>

                      {place.partner && (
                        <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#8EC5FF]">
                          Partner
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-[#71869A]">
                      {place.category}
                      {" · "}
                      {place.area}
                    </p>

                    <p className="mt-3 text-sm text-[#A9B5C3]">
                      {place.address}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-[#8EC5FF]">
                        {place.price}
                      </span>

                      <span className="text-xs text-[#71869A]">
                        Edit →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      </section>
    </>
  );
}
