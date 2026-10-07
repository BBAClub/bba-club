"use client";

import {
  useMemo,
  useState,
} from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PragueMap from "@/components/PragueMap";

import {
  categories,
  type Category,
  type Place,
} from "@/data/places";

type ExploreClientProps = {
  places: Place[];
};

export default function ExploreClient({
  places,
}: ExploreClientProps) {
  const [
    activeCategory,
    setActiveCategory,
  ] =
    useState<Category>(
      "All"
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    openPlace,
    setOpenPlace,
  ] =
    useState<string | null>(
      null
    );

  const [
    desktopSelectedPlace,
    setDesktopSelectedPlace,
  ] =
    useState<Place | null>(
      places[0] ?? null
    );

  const filteredPlaces =
    useMemo(() => {
      const query =
        search
          .toLowerCase()
          .trim();

      return places.filter(
        (place) => {
          const matchesCategory =
            activeCategory ===
              "All" ||
            place.category ===
              activeCategory;

          const matchesSearch =
            query === "" ||
            place.name
              .toLowerCase()
              .includes(query) ||
            place.area
              .toLowerCase()
              .includes(query) ||
            place.address
              .toLowerCase()
              .includes(query) ||
            place.category
              .toLowerCase()
              .includes(query);

          return (
            matchesCategory &&
            matchesSearch
          );
        }
      );
    }, [
      activeCategory,
      search,
      places,
    ]);

  const mobileSelectedPlace =
    openPlace === null
      ? null
      : places.find(
          (place) =>
            place.name ===
            openPlace
        ) ?? null;

  const desktopVisiblePlace =
    filteredPlaces.find(
      (place) =>
        place.name ===
        desktopSelectedPlace?.name
    ) ??
    filteredPlaces[0] ??
    null;

  const featuredPartner =
    places.find(
      (place) =>
        place.partner &&
        place.promoCode &&
        place.promoText
    ) ?? null;

  function toggleMobilePlace(
    place: Place
  ) {
    setOpenPlace(
      (current) =>
        current === place.name
          ? null
          : place.name
    );
  }

  function changeCategory(
    category: Category
  ) {
    const newPlaces =
      category === "All"
        ? places
        : places.filter(
            (place) =>
              place.category ===
              category
          );

    setActiveCategory(
      category
    );

    setOpenPlace(null);

    setDesktopSelectedPlace(
      newPlaces[0] ??
        null
    );
  }

  function changeSearch(
    value: string
  ) {
    setSearch(value);
    setOpenPlace(null);
  }

  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      {/* HERO */}

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-14 md:py-20 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,87,255,0.16),transparent_34%)]" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
            BBA Club · Prague Guide
          </p>

          <div className="mt-4 grid gap-7 lg:grid-cols-[1fr_0.7fr] lg:items-end lg:gap-10">
            <div>
              <h1 className="max-w-4xl text-[42px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl md:text-7xl">
                Discover Prague
                <br />

                <span className="text-[#0057FF]">
                  like a local.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-[#A9B5C3] md:mt-7 md:text-lg md:leading-8">
                Cafés, places to study,
                food, nightlife and
                everything else worth
                knowing — recommended by
                students who actually live
                here.
              </p>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-[#0D1D2C] p-5 md:rounded-[24px] md:p-6">
              <p className="text-xs font-semibold text-[#8EC5FF] md:text-sm">
                BBA Club tip
              </p>

              <p className="mt-2 text-sm leading-6 text-[#A9B5C3] md:mt-3 md:text-base md:leading-7">
                Look for the{" "}

                <span className="font-semibold text-white">
                  BBA Club Perk
                </span>{" "}

                badge. Partner venues may
                offer special discounts or
                benefits to our community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN GUIDE */}

      <section className="px-6 py-12 md:py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          {/* SEARCH */}

          <div className="mb-4 md:mb-6">
            <input
              type="text"
              placeholder="Search places, neighbourhoods, addresses..."
              value={search}
              onChange={(
                event
              ) =>
                changeSearch(
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-white/10 bg-[#0B1A29] px-5 py-3.5 text-sm text-white outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]/70 md:max-w-xl md:py-4 md:text-base"
            />
          </div>

          {/* FILTERS */}

          <div className="mb-7 flex flex-wrap gap-2 md:mb-10 md:gap-3">
            {categories.map(
              (category) => (
                <button
                  key={
                    category
                  }
                  type="button"
                  onClick={() =>
                    changeCategory(
                      category
                    )
                  }
                  className={`rounded-full px-4 py-2 text-xs font-medium transition md:px-5 md:py-2.5 md:text-sm ${
                    activeCategory ===
                    category
                      ? "bg-[#0057FF] text-white"
                      : "border border-white/10 bg-white/5 text-[#A9B5C3] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              )
            )}
          </div>

          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs text-[#71869A] md:text-sm">
              {
                filteredPlaces.length
              }{" "}
              places
            </p>

            <p className="text-[10px] uppercase tracking-[0.18em] text-[#53687D] md:text-xs">
              Student picks
            </p>
          </div>

          {/* MOBILE */}

          <div className="space-y-3 lg:hidden">
            {filteredPlaces.length >
            0 ? (
              filteredPlaces.map(
                (place) => {
                  const isOpen =
                    openPlace ===
                    place.name;

                  return (
                    <div
                      key={
                        place.name
                      }
                      className="space-y-3"
                    >
                      <article
                        className={`overflow-hidden rounded-[20px] border transition ${
                          isOpen
                            ? "border-[#0057FF]/70 bg-[#0E2237]"
                            : "border-white/10 bg-[#0B1A29]"
                        }`}
                      >
                        {place.coverImageUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              toggleMobilePlace(
                                place
                              )
                            }
                            className="relative block h-44 w-full overflow-hidden text-left"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                place.coverImageUrl
                              }
                              alt={
                                place.coverImageAlt ??
                                place.name
                              }
                              className="h-full w-full object-cover"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-[#071422]/80 via-transparent to-transparent" />

                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#071422]/80 text-lg backdrop-blur-sm">
                                {
                                  place.symbol
                                }
                              </div>

                              {place.partner && (
                                <span className="rounded-full border border-[#0057FF]/40 bg-[#071422]/80 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#8EC5FF] backdrop-blur-sm">
                                  BBA Perk
                                </span>
                              )}
                            </div>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            toggleMobilePlace(
                              place
                            )
                          }
                          className="w-full p-4 text-left"
                        >
                          <div className="flex items-start gap-3">
                            {!place.coverImageUrl && (
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                                  isOpen
                                    ? "bg-[#0057FF]"
                                    : "bg-white/5"
                                }`}
                              >
                                {
                                  place.symbol
                                }
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-base font-semibold">
                                      {
                                        place.name
                                      }
                                    </h2>

                                    {place.partner &&
                                      !place.coverImageUrl && (
                                        <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#8EC5FF]">
                                          BBA
                                          Perk
                                        </span>
                                      )}
                                  </div>

                                  <p className="mt-1 text-xs text-[#71869A]">
                                    {
                                      place.category
                                    }{" "}
                                    ·{" "}
                                    {
                                      place.area
                                    }
                                  </p>
                                </div>

                                <span className="shrink-0 text-xs text-[#8EC5FF]">
                                  {
                                    place.price
                                  }
                                </span>
                              </div>

                              <p className="mt-2 text-sm leading-5 text-[#A9B5C3]">
                                {
                                  place.description
                                }
                              </p>

                              <p className="mt-2 text-xs text-[#5E7690]">
                                {
                                  place.address
                                }
                              </p>

                              <div className="mt-3 flex justify-end">
                                <span
                                  className={`text-[#5790FF] transition-transform ${
                                    isOpen
                                      ? "rotate-90"
                                      : ""
                                  }`}
                                >
                                  →
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-white/10 px-4 pb-4 pt-4">
                            {place.partner &&
                            place.promoCode ? (
                              <div className="rounded-xl border border-[#0057FF]/30 bg-[#0057FF]/10 p-4">
                                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8EC5FF]">
                                  BBA
                                  Club
                                  Perk
                                </p>

                                <p className="mt-2 text-sm font-semibold">
                                  {
                                    place.promoText
                                  }
                                </p>

                                <div className="mt-3 flex items-center justify-between rounded-lg bg-[#071422] px-3 py-2.5">
                                  <span className="text-[9px] uppercase tracking-[0.12em] text-[#53687D]">
                                    Promo
                                    code
                                  </span>

                                  <span className="font-mono text-sm font-bold tracking-wider">
                                    {
                                      place.promoCode
                                    }
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-[#71869A]">
                                Explore
                                this place
                                on the map
                                below.
                              </p>
                            )}
                          </div>
                        )}
                      </article>

                      {isOpen && (
                        <PragueMap
                          placesToShow={
                            filteredPlaces
                          }
                          selectedPlace={
                            mobileSelectedPlace
                          }
                          onSelect={(
                            mapPlace
                          ) =>
                            setOpenPlace(
                              mapPlace.name
                            )
                          }
                          compact
                        />
                      )}
                    </div>
                  );
                }
              )
            ) : (
              <div className="rounded-[20px] border border-dashed border-white/15 p-8 text-center">
                <p className="font-semibold">
                  No places found.
                </p>

                <p className="mt-2 text-sm text-[#71869A]">
                  Try another category or
                  search term.
                </p>
              </div>
            )}
          </div>

          {/* DESKTOP */}

          <div className="hidden gap-7 lg:grid lg:grid-cols-[0.85fr_1.15fr]">
            {/* LIST */}

            <div className="space-y-3">
              {filteredPlaces.length >
              0 ? (
                filteredPlaces.map(
                  (place) => (
                    <button
                      key={
                        place.name
                      }
                      type="button"
                      onClick={() =>
                        setDesktopSelectedPlace(
                          place
                        )
                      }
                      className={`group flex w-full items-center gap-5 overflow-hidden rounded-[20px] border p-5 text-left transition ${
                        desktopVisiblePlace
                          ?.name ===
                        place.name
                          ? "border-[#0057FF]/70 bg-[#0E2237]"
                          : "border-white/10 bg-[#0B1A29] hover:border-white/20 hover:bg-[#0E2032]"
                      }`}
                    >
                      {place.coverImageUrl ? (
                        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              place.coverImageUrl
                            }
                            alt={
                              place.coverImageAlt ??
                              place.name
                            }
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                            desktopVisiblePlace
                              ?.name ===
                            place.name
                              ? "bg-[#0057FF]"
                              : "bg-white/5"
                          }`}
                        >
                          {
                            place.symbol
                          }
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold">
                            {
                              place.name
                            }
                          </h2>

                          {place.partner && (
                            <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8EC5FF]">
                              BBA
                              Club
                              Perk
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-[#71869A]">
                          {
                            place.category
                          }{" "}
                          ·{" "}
                          {
                            place.area
                          }
                        </p>

                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#A9B5C3]">
                          {
                            place.description
                          }
                        </p>

                        <p className="mt-2 truncate text-xs text-[#53687D]">
                          {
                            place.address
                          }
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-5">
                        <span className="text-sm text-[#8EC5FF]">
                          {
                            place.price
                          }
                        </span>

                        <span className="text-[#5790FF]">
                          →
                        </span>
                      </div>
                    </button>
                  )
                )
              ) : (
                <div className="rounded-[20px] border border-dashed border-white/15 p-8 text-center">
                  <p className="font-semibold">
                    No places found.
                  </p>
                </div>
              )}
            </div>

            {/* MAP */}

            <div className="sticky top-24 self-start">
              <PragueMap
                placesToShow={
                  filteredPlaces
                }
                selectedPlace={
                  desktopVisiblePlace
                }
                onSelect={
                  setDesktopSelectedPlace
                }
              />

              {desktopVisiblePlace && (
                <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-[#0B1A29]">
                  {desktopVisiblePlace.coverImageUrl && (
                    <div className="relative h-64 w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          desktopVisiblePlace.coverImageUrl
                        }
                        alt={
                          desktopVisiblePlace.coverImageAlt ??
                          desktopVisiblePlace.name
                        }
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1A29] via-transparent to-transparent" />

                      <div className="absolute bottom-5 left-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#071422]/85 text-2xl backdrop-blur-sm">
                        {
                          desktopVisiblePlace.symbol
                        }
                      </div>
                    </div>
                  )}

                  <div className="p-7">
                    <div className="flex items-start gap-5">
                      {!desktopVisiblePlace.coverImageUrl && (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0057FF] text-2xl">
                          {
                            desktopVisiblePlace.symbol
                          }
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8EC5FF]">
                            {
                              desktopVisiblePlace.category
                            }
                          </p>

                          {desktopVisiblePlace.partner && (
                            <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8EC5FF]">
                              BBA
                              Club
                              Perk
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-3">
                          <h3 className="text-2xl font-semibold">
                            {
                              desktopVisiblePlace.name
                            }
                          </h3>

                          <span className="text-sm text-[#8EC5FF]">
                            {
                              desktopVisiblePlace.price
                            }
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-[#71869A]">
                          {
                            desktopVisiblePlace.area
                          }
                        </p>

                        <p className="mt-1 text-sm text-[#53687D]">
                          {
                            desktopVisiblePlace.address
                          }
                        </p>

                        <p className="mt-4 leading-7 text-[#A9B5C3]">
                          {
                            desktopVisiblePlace.description
                          }
                        </p>
                      </div>
                    </div>

                    {desktopVisiblePlace.partner &&
                      desktopVisiblePlace.promoCode && (
                        <div className="mt-6 border-t border-white/10 pt-6">
                          <div className="rounded-2xl border border-[#0057FF]/30 bg-[#0057FF]/10 p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8EC5FF]">
                              BBA
                              Club
                              Perk
                            </p>

                            <p className="mt-3 font-semibold">
                              {
                                desktopVisiblePlace.promoText
                              }
                            </p>

                            <div className="mt-4 inline-block rounded-xl bg-[#071422] px-5 py-3">
                              <p className="text-[10px] uppercase tracking-[0.14em] text-[#53687D]">
                                Promo
                                code
                              </p>

                              <p className="mt-1 font-mono font-bold tracking-wider">
                                {
                                  desktopVisiblePlace.promoCode
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERS */}

      <section className="border-t border-white/10 bg-[#091725] px-6 py-16 md:py-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-center lg:gap-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
              BBA Club Partners
            </p>

            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.03em] md:text-5xl">
              More than recommendations.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#A9B5C3] md:mt-5 md:text-lg md:leading-8">
              Over time, selected
              businesses can offer BBA Club
              students special discounts,
              offers or other perks.
            </p>
          </div>

          {featuredPartner ? (
            <div className="overflow-hidden rounded-[22px] border border-[#0057FF]/30 bg-[#0D2035] md:rounded-[26px]">
              {featuredPartner.coverImageUrl && (
                <div className="h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      featuredPartner.coverImageUrl
                    }
                    alt={
                      featuredPartner.coverImageAlt ??
                      featuredPartner.name
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="p-6 md:p-7">
                <p className="text-xs font-semibold text-[#8EC5FF] md:text-sm">
                  BBA Club Perk
                </p>

                <p className="mt-3 text-xl font-semibold md:mt-4 md:text-2xl">
                  {
                    featuredPartner.promoText
                  }{" "}
                  at{" "}
                  {
                    featuredPartner.name
                  }
                </p>

                <p className="mt-3 text-sm leading-6 text-[#A9B5C3] md:text-base">
                  Show or enter your BBA Club
                  code when ordering.
                </p>

                <div className="mt-5 inline-flex rounded-xl bg-[#071422] px-4 py-3 font-mono text-sm font-bold tracking-wider md:mt-6 md:px-5 md:text-base">
                  {
                    featuredPartner.promoCode
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-white/10 bg-[#0D2035] p-6 md:rounded-[26px] md:p-7">
              <p className="text-sm leading-6 text-[#A9B5C3]">
                Partner perks will appear
                here as they become
                available.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}