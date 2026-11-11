"use client";
import Image from "next/image";

import { useState } from "react";
import Link from "next/link";
import PragueMap from "@/components/PragueMap";
import { categories, type Category, type Place } from "@/data/places";

export default function HomepageExplore({ places }: { places: Place[] }) {
  const [activeCategory, setActiveCategory] =

    useState<Category>("All");

  const [

    mobileSelectedPlace,

    setMobileSelectedPlace,

  ] = useState<Place | null>(null);

  const [

    desktopSelectedPlace,

    setDesktopSelectedPlace,

  ] = useState<Place | null>(

    places[0] ?? null

  );

  const filteredPlaces =

    activeCategory === "All"

      ? places

      : places.filter(

          (place) =>

            place.category === activeCategory

        );

  /*

    Pokud změnou filtru zmizí

    aktuálně vybrané místo,

    vezmeme první dostupné.

  */

  const desktopVisiblePlace =

    filteredPlaces.find(

      (place) =>

        place.name ===

        desktopSelectedPlace?.name

    ) ??

    filteredPlaces[0] ??

    null;

  function changeCategory(

    category: Category

  ) {

    const newPlaces =

      category === "All"

        ? places

        : places.filter(

            (place) =>

              place.category === category

          );

    setActiveCategory(category);

    setMobileSelectedPlace(null);

    setDesktopSelectedPlace(

      newPlaces[0] ?? null

    );

  }

  return (
    <section

        id="prague"

        className="border-t border-white/10 bg-[#071422] px-6 py-16 lg:px-10 lg:py-24"

      >

        <div className="mx-auto max-w-7xl">

          <div className="mb-8 sm:mb-10">

            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EC5FF]">

              Discover more

            </p>

            <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">

              <div>

                <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl md:text-5xl">

                  Explore Prague

                </h2>

                <p className="mt-3 max-w-xl text-[#A9B5C3]">

                  Places worth knowing,

                  recommended by students who

                  actually live here.

                </p>

              </div>

              <Link

                href="/explore"

                className="text-sm font-semibold text-[#5790FF] transition hover:text-white"

              >

                View full guide →

              </Link>

            </div>

          </div>

          {/* FILTERS */}

          <div className="mb-8 flex flex-wrap gap-3">

            {categories.map((category) => (

              <button

                key={category}

                type="button"

                onClick={() =>

                  changeCategory(category)

                }

                className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${

                  activeCategory === category

                    ? "bg-[#0057FF] text-white"

                    : "border border-white/10 bg-white/5 text-[#A9B5C3] hover:bg-white/10 hover:text-white"

                }`}

              >

                {category}

              </button>

            ))}

          </div>

          {places.length === 0 ? (

            <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.02] p-8 text-center md:p-12">

              <p className="font-semibold md:text-lg">

                Prague recommendations are

                coming soon.

              </p>

              <p className="mt-2 text-sm text-[#71869A]">

                Places added in Sanity will

                automatically appear here.

              </p>

              <Link

                href="/explore"

                className="mt-5 inline-block text-sm font-semibold text-[#5790FF] transition hover:text-white"

              >

                Open Prague Guide →

              </Link>

            </div>

          ) : (

            <>

              {/* MOBILE */}

              <div className="space-y-3 md:hidden">

                {filteredPlaces.length > 0 ? (

                  filteredPlaces.map(

                    (place) => {

                      const isSelected =

                        mobileSelectedPlace?.name ===

                        place.name;

                      return (

                        <div

                          key={place.name}

                          className="space-y-3"

                        >

                          <div

                            className={`overflow-hidden rounded-[20px] border transition ${

                              isSelected

                                ? "border-[#0057FF]/60 bg-[#0E2237]"

                                : "border-white/10 bg-[#0B1A29]"

                            }`}

                          >

                            <button

                              type="button"

                              onClick={() =>

                                setMobileSelectedPlace(

                                  isSelected

                                    ? null

                                    : place

                                )

                              }

                              aria-expanded={

                                isSelected

                              }

                              className="group w-full text-left"

                            >

                              <div className="flex items-center gap-4 p-4">

                                {place.coverImageUrl ? (

                                  <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">


                                    <Image
                                      fill sizes="64px"

                                      src={place.coverImageUrl}

                                      alt={

                                        place.coverImageAlt ?? place.name

                                      }

                                      className="h-full w-full object-cover"

                                    />

                                  </div>

                                ) : (

                                  <div

                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${

                                      isSelected

                                        ? "bg-[#0057FF]"

                                        : "bg-white/5"

                                    }`}

                                  >

                                    {place.symbol}

                                  </div>

                                )}

                                <div className="min-w-0 flex-1">

                                  <div className="flex items-start justify-between gap-3">

                                    <div className="min-w-0">

                                      <div className="flex flex-wrap items-center gap-2">

                                        <h3 className="font-semibold">

                                          {place.name}

                                        </h3>

                                        {place.partner && (

                                          <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#8EC5FF]">

                                            BBA Perk

                                          </span>

                                        )}

                                      </div>

                                      <p className="mt-1 text-sm text-[#6F8499]">

                                        {

                                          place.category

                                        }{" "}

                                        · {place.area}

                                      </p>

                                    </div>

                                    <span className="shrink-0 text-sm text-[#8EC5FF]">

                                      {place.price}

                                    </span>

                                  </div>

                                  <p className="mt-2 text-sm leading-5 text-[#A9B5C3]">

                                    {

                                      place.description

                                    }

                                  </p>

                                </div>

                                <span

                                  className={`shrink-0 text-[#5790FF] transition-transform ${

                                    isSelected

                                      ? "rotate-90"

                                      : ""

                                  }`}

                                >

                                  →

                                </span>

                              </div>

                            </button>

                            {isSelected && (

                              <div className="border-t border-white/10 px-4 pb-5 pt-4">

                                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#8EA0B3]">

                                  <span>

                                    <span className="text-[#5E7690]">

                                      Area:

                                    </span>{" "}

                                    {place.area}

                                  </span>

                                  <span>

                                    <span className="text-[#5E7690]">

                                      Category:

                                    </span>{" "}

                                    {

                                      place.category

                                    }

                                  </span>

                                  <span>

                                    <span className="text-[#5E7690]">

                                      Price:

                                    </span>{" "}

                                    {place.price}

                                  </span>

                                </div>

                                {place.partner &&

                                  place.promoCode && (

                                    <div className="mt-4 rounded-xl border border-[#0057FF]/30 bg-[#0057FF]/10 p-4">

                                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8EC5FF]">

                                        BBA Club

                                        Perk

                                      </p>

                                      <p className="mt-2 text-sm font-semibold">

                                        {

                                          place.promoText

                                        }

                                      </p>

                                      <div className="mt-3 rounded-lg bg-[#071422] px-3 py-2.5">

                                        <span className="font-mono text-sm font-bold tracking-wider">

                                          {

                                            place.promoCode

                                          }

                                        </span>

                                      </div>

                                    </div>

                                  )}

                                <div className="mt-4 text-right">

                                  <Link

                                    href="/explore"

                                    className="text-sm font-semibold text-[#5790FF] transition hover:text-white"

                                  >

                                    View in

                                    Prague Guide

                                    →

                                  </Link>

                                </div>

                              </div>

                            )}

                          </div>

                          {/* REAL LEAFLET MAP - MOBILE */}

                          {isSelected && (

                            <PragueMap

                              placesToShow={

                                filteredPlaces

                              }

                              selectedPlace={

                                place

                              }

                              onSelect={(

                                selected

                              ) =>

                                setMobileSelectedPlace(

                                  selected

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

                      No places in this

                      category yet.

                    </p>

                  </div>

                )}

              </div>

              {/* DESKTOP */}

              <div className="hidden gap-5 md:grid md:grid-cols-[0.85fr_1.15fr] lg:gap-7">

                {/* PLACE LIST */}

                <div className="space-y-3">

                  {filteredPlaces.length >

                  0 ? (

                    filteredPlaces.map(

                      (place) => {

                        const isSelected =

                          desktopVisiblePlace?.name ===

                          place.name;

                        return (

                          <button

                            key={place.name}

                            type="button"

                            onClick={() =>

                              setDesktopSelectedPlace(

                                place

                              )

                            }

                            className={`group flex w-full items-center gap-4 rounded-[20px] border p-4 text-left transition lg:gap-5 lg:p-5 ${

                              isSelected

                                ? "border-[#0057FF]/70 bg-[#0E2237]"

                                : "border-white/10 bg-[#0B1A29] hover:border-white/20 hover:bg-[#0E2032]"

                            }`}

                          >

                            {place.coverImageUrl ? (

                              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5 lg:h-20 lg:w-24 lg:rounded-2xl">


                                <Image
                                  fill sizes="(min-width: 1024px) 96px, 80px"

                                  src={place.coverImageUrl}

                                  alt={

                                    place.coverImageAlt ?? place.name

                                  }

                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"

                                />

                              </div>

                            ) : (

                              <div

                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl lg:h-14 lg:w-14 lg:rounded-2xl lg:text-2xl ${

                                  isSelected

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

                                <h3 className="text-base font-semibold lg:text-lg">

                                  {place.name}

                                </h3>

                                {place.partner && (

                                  <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#8EC5FF] lg:px-2.5 lg:py-1 lg:text-[9px]">

                                    BBA Club

                                    Perk

                                  </span>

                                )}

                              </div>

                              <p className="mt-1 text-sm text-[#71869A]">

                                {

                                  place.category

                                }{" "}

                                · {place.area}

                              </p>

                              <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#A9B5C3] lg:line-clamp-none">

                                {

                                  place.description

                                }

                              </p>

                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-5">

                              <span className="text-sm text-[#8EC5FF]">

                                {place.price}

                              </span>

                              <span className="text-[#5790FF]">

                                →

                              </span>

                            </div>

                          </button>

                        );

                      }

                    )

                  ) : (

                    <div className="rounded-[20px] border border-dashed border-white/15 p-8 text-center">

                      <p className="font-semibold">

                        No places in this

                        category yet.

                      </p>

                    </div>

                  )}

                </div>

                {/* MAP + SELECTED PLACE */}

                <div className="sticky top-24 self-start">

                  {filteredPlaces.length >

                  0 ? (

                    <>

                      {/* REAL LEAFLET MAP - DESKTOP */}

                      <PragueMap

                        placesToShow={

                          filteredPlaces

                        }

                        selectedPlace={

                          desktopVisiblePlace

                        }

                        onSelect={(

                          selected

                        ) =>

                          setDesktopSelectedPlace(

                            selected

                          )

                        }

                      />

                      {desktopVisiblePlace && (

                        <div className="mt-5 rounded-[26px] border border-white/10 bg-[#0B1A29] p-5 lg:p-6">

                          <div className="flex items-start gap-4">

                            {desktopVisiblePlace.coverImageUrl ? (

                              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-white/5 lg:h-24 lg:w-32">


                                <Image
                                  fill sizes="(min-width: 1024px) 128px, 96px"

                                  src={

                                    desktopVisiblePlace.coverImageUrl

                                  }

                                  alt={

                                    desktopVisiblePlace.coverImageAlt ?? desktopVisiblePlace.name

                                  }

                                  className="h-full w-full object-cover"

                                />

                              </div>

                            ) : (

                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0057FF] text-2xl">

                                {

                                  desktopVisiblePlace.symbol

                                }

                              </div>

                            )}

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8EC5FF]">

                                  {

                                    desktopVisiblePlace.category

                                  }

                                </p>

                                {desktopVisiblePlace.partner && (

                                  <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8EC5FF]">

                                    BBA Club

                                    Perk

                                  </span>

                                )}

                              </div>

                              <div className="mt-1 flex items-center justify-between gap-4">

                                <h3 className="text-xl font-semibold lg:text-2xl">

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

                              <p className="mt-4 leading-7 text-[#A9B5C3]">

                                {

                                  desktopVisiblePlace.description

                                }

                              </p>

                              {desktopVisiblePlace.partner &&

                                desktopVisiblePlace.promoCode && (

                                  <div className="mt-5 rounded-xl border border-[#0057FF]/30 bg-[#0057FF]/10 p-4">

                                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8EC5FF]">

                                      BBA Club

                                      Perk

                                    </p>

                                    <p className="mt-2 text-sm font-semibold">

                                      {

                                        desktopVisiblePlace.promoText

                                      }

                                    </p>

                                    <div className="mt-3 inline-block rounded-lg bg-[#071422] px-3 py-2 font-mono text-sm font-bold tracking-wider">

                                      {

                                        desktopVisiblePlace.promoCode

                                      }

                                    </div>

                                  </div>

                                )}

                              <Link

                                href="/explore"

                                className="mt-5 inline-block text-sm font-semibold text-[#5790FF] transition hover:text-white"

                              >

                                View in

                                Prague Guide

                                →

                              </Link>

                            </div>

                          </div>

                        </div>

                      )}

                    </>

                  ) : (

                    <div className="rounded-[26px] border border-dashed border-white/15 bg-[#091A2A] p-10 text-center text-[#71869A]">

                      No places to show

                      on the map.

                    </div>

                  )}

                </div>

              </div>

              <p className="mt-5 text-xs leading-5 text-[#53687D] md:hidden">

                Tap a place to preview its

                location.

              </p>

            </>

          )}

        </div>

      </section>
  );
}
