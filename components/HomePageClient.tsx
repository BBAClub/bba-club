"use client";



import { useState } from "react";

import Link from "next/link";



import Navbar from "@/components/Navbar";

import Footer from "@/components/Footer";
import HomepageHero from "@/components/HomepageHero";

import PragueMap from "@/components/PragueMap";



import type { Event } from "@/data/events";



import {

  categories,

  type Category,

  type Place,

} from "@/data/places";



import { studyHighlights } from "@/data/study";



type HomePageClientProps = {

  events: Event[];

  places: Place[];

  heroImageUrl?: string;

  heroImageAlt?: string;

};



export default function HomePageClient({

  events,

  places: allPlaces,

  heroImageUrl,

  heroImageAlt,

}: HomePageClientProps) {

  /*

    Na homepage zobrazíme maximálně

    prvních 6 Places ze Sanity.

  */

  const places = allPlaces.slice(0, 6);



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



  const upcomingEvents = events.filter(

    (event) =>

      event.status === "upcoming"

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

    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">

      <Navbar />



      {/* HERO */}

      <HomepageHero
        heroImageUrl={heroImageUrl}
        heroImageAlt={heroImageAlt}
      />



      {/* EVENTS */}

      <section

        id="events"

        className="border-t border-white/10 bg-[#091725] px-6 py-16 lg:px-10 lg:py-20"

      >

        <div className="mx-auto max-w-7xl">

          <div className="mb-8 flex items-end justify-between gap-8 sm:mb-10">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EC5FF]">

                Get involved

              </p>



              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl md:text-5xl">

                Upcoming Events

              </h2>



              <p className="mt-3 text-[#A9B5C3]">

                Meet people, try something

                new and make the most of

                student life.

              </p>

            </div>



            <Link

              href="/events"

              className="hidden text-sm font-semibold text-[#5790FF] transition hover:text-white md:block"

            >

              View all events →

            </Link>

          </div>



          {upcomingEvents.length > 0 ? (

            <div className="grid gap-5 md:grid-cols-3">

              {upcomingEvents

                .slice(0, 3)

                .map((event) => (

                  <article

                    key={event.slug}

                    className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#0D1D2C] transition duration-300 hover:-translate-y-1 hover:border-[#0057FF]/50"

                  >

                    <div

                      className={`relative h-40 overflow-hidden bg-gradient-to-br ${event.gradient} p-5 sm:h-48 sm:p-6`}

                      style={
                        event.coverImageUrl
                          ? {
                              backgroundImage: `url("${event.coverImageUrl}")`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }

                      role={
                        event.coverImageUrl
                          ? "img"
                          : undefined
                      }

                      aria-label={
                        event.coverImageUrl
                          ? event.coverImageAlt ?? event.title
                          : undefined
                      }

                    >

                      {event.coverImageUrl && (
                        <div className="absolute inset-0 bg-gradient-to-t from-[#071422]/80 via-[#071422]/20 to-black/20" />
                      )}

                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_28%)]" />



                      <div className="relative flex h-full flex-col justify-between">

                        <div className="flex items-start justify-between">

                          <span className="rounded-full border border-white/15 bg-black/15 px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-white/80">

                            {event.label}

                          </span>



                          <div className="rounded-xl bg-[#071422]/80 px-3 py-2 text-center">

                            <div className="text-xs font-semibold text-[#8EC5FF]">

                              {event.month}

                            </div>



                            <div className="text-2xl font-bold leading-none">

                              {event.date}

                            </div>

                          </div>

                        </div>



                        <div className="h-px w-16 bg-[#0057FF]" />

                      </div>

                    </div>



                    <div className="p-5 sm:p-6">

                      <h3 className="text-xl font-semibold">

                        {event.title}

                      </h3>



                      <p className="mt-3 text-sm leading-6 text-[#8EA0B3] md:min-h-[48px]">

                        {event.description}

                      </p>



                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm sm:mt-6 sm:pt-5">

                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[#A9B5C3]">

                          <span>

                            ⌖ {event.location}

                          </span>



                          <span>

                            ◷ {event.time}

                          </span>

                          {event.price !== undefined && (
                            <span className="font-semibold text-[#8EC5FF]">
                              {event.price === 0
                                ? "Free"
                                : `${event.price} CZK`}
                            </span>
                          )}

                        </div>



                        <Link

                          href={`/events/${event.slug}`}

                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#5790FF] transition hover:bg-[#0057FF] hover:text-white"

                          aria-label={`View details for ${event.title}`}

                        >

                          →

                        </Link>

                      </div>

                    </div>

                  </article>

                ))}

            </div>

          ) : (

            <div className="rounded-[24px] border border-dashed border-white/15 p-8 text-center">

              <p className="font-semibold">

                No upcoming events yet.

              </p>



              <p className="mt-2 text-sm text-[#71869A]">

                New events will appear here

                when they are published.

              </p>

            </div>

          )}

        </div>

      </section>



      {/* EXPLORE PRAGUE */}

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

                                <div

                                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${

                                    isSelected

                                      ? "bg-[#0057FF]"

                                      : "bg-white/5"

                                  }`}

                                >

                                  {place.symbol}

                                </div>



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

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0057FF] text-2xl">

                              {

                                desktopVisiblePlace.symbol

                              }

                            </div>



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



      {/* STUDY HUB */}

      <section

        id="study"

        className="border-t border-white/10 bg-[#091725] px-6 py-16 lg:px-10 lg:py-24"

      >

        <div className="mx-auto max-w-7xl">

          <div className="mb-8 flex flex-col justify-between gap-5 sm:mb-10 md:flex-row md:items-end">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EC5FF]">

                Learn · Share · Grow

              </p>



              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl md:text-5xl">

                Study Hub

              </h2>



              <p className="mt-3 max-w-xl text-[#A9B5C3]">

                Everything that can make

                studying at VŠE a little

                easier — gathered in one

                place.

              </p>

            </div>



            <Link

              href="/study"

              className="text-sm font-semibold text-[#5790FF] transition hover:text-white"

            >

              Explore all resources →

            </Link>

          </div>



          <div className="grid gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-4">

            {studyHighlights.map(

              (item) => {

                const isGreen =

                  item.accent === "green";



                const isPrimary =

                  item.accent === "blue";



                return (

                  <article

                    key={item.title}

                    className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0D1D2C] p-5 transition hover:-translate-y-1 hover:border-[#0057FF]/50 md:min-h-[250px] md:rounded-[24px] md:p-6"

                  >

                    <div

                      className={`absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl ${

                        isGreen

                          ? "bg-[#94B89F]/10"

                          : isPrimary

                            ? "bg-[#0057FF]/10"

                            : "bg-[#8EC5FF]/10"

                      }`}

                    />



                    <div className="relative">

                      <div

                        className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold md:h-12 md:w-12 ${

                          isPrimary

                            ? "bg-[#0057FF] text-white"

                            : isGreen

                              ? "border border-[#94B89F]/20 bg-[#94B89F]/10 text-[#B6D2BF]"

                              : "border border-white/10 bg-white/5 text-[#8EC5FF]"

                        }`}

                      >

                        {item.number}

                      </div>



                      <h3 className="mt-5 text-lg font-semibold md:mt-8 md:text-xl">

                        {item.title}

                      </h3>



                      <p className="mt-2 text-sm leading-5 text-[#8EA0B3] md:mt-3 md:leading-6">

                        {

                          item.description

                        }

                      </p>



                      <div className="mt-4 flex items-center justify-between md:mt-7">

                        <span

                          className={`text-[10px] font-semibold uppercase tracking-[0.16em] md:text-xs ${

                            isGreen

                              ? "text-[#9BC3A8]"

                              : "text-[#5790FF]"

                          }`}

                        >

                          {item.label}

                        </span>



                        <span className="transition group-hover:translate-x-1">

                          →

                        </span>

                      </div>

                    </div>

                  </article>

                );

              }

            )}

          </div>

        </div>

      </section>



      {/* ABOUT */}

      <section

        id="about"

        className="relative overflow-hidden border-t border-white/10 bg-[#071422] px-6 py-16 lg:px-10 lg:py-24"

      >

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0057FF]/5 blur-3xl" />



        <div className="relative mx-auto max-w-7xl">

          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EC5FF]">

                Our community

              </p>



              <h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl md:text-5xl">

                More than

                <br />

                just university.

              </h2>



              <p className="mt-5 max-w-md text-base leading-7 text-[#A9B5C3] sm:mt-6 md:text-lg md:leading-8">

                BBA Club is here to connect

                students, make Prague easier

                to discover and create a

                stronger community around the

                programme.

              </p>



              <Link

                href="/about"

                className="mt-7 inline-flex rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold transition hover:border-[#0057FF]/50 hover:bg-white/10 sm:mt-8"

              >

                About BBA Club →

              </Link>

            </div>



            <div className="grid gap-4 sm:grid-cols-2">

              {[

                {

                  number: "01",

                  title: "Student-led",

                  text: "Built by students who know what university life actually looks like.",

                },

                {

                  number: "02",

                  title: "International",

                  text: "Different backgrounds, perspectives and experiences in one community.",

                },

                {

                  number: "03",

                  title: "Connected",

                  text: "Events, resources and people that help make university feel less anonymous.",

                },

              ].map((value) => (

                <div

                  key={value.number}

                  className="rounded-[24px] border border-white/10 bg-[#0B1A29] p-5 sm:p-7"

                >

                  <div className="text-sm font-semibold text-[#5790FF]">

                    {value.number}

                  </div>



                  <h3 className="mt-6 text-xl font-semibold sm:mt-8 sm:text-2xl">

                    {value.title}

                  </h3>



                  <p className="mt-3 leading-7 text-[#8EA0B3]">

                    {value.text}

                  </p>

                </div>

              ))}



              <div className="rounded-[24px] border border-[#0057FF]/30 bg-[#0D2035] p-5 sm:p-7">

                <div className="text-sm font-semibold text-[#8EC5FF]">

                  BBA

                </div>



                <h3 className="mt-6 text-xl font-semibold sm:mt-8 sm:text-2xl">

                  Built together

                </h3>



                <p className="mt-3 leading-7 text-[#A9B5C3]">

                  The club grows with the

                  people who become part of

                  it.

                </p>

              </div>

            </div>

          </div>



          <div className="mt-12 flex flex-col justify-between gap-6 rounded-[28px] border border-white/10 bg-[linear-gradient(120deg,#0D2035,#0A1929)] p-6 sm:p-8 md:mt-20 md:flex-row md:items-center md:gap-8 md:p-10">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8EC5FF]">

                Stay connected

              </p>



              <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">

                See what's happening in

                BBA Club.

              </h3>



              <p className="mt-3 text-[#8EA0B3]">

                Events, updates and everything

                happening around the

                community.

              </p>

            </div>



            <a

              href="https://instagram.com/bbaclubvse"

              target="_blank"

              rel="noreferrer"

              className="w-full shrink-0 rounded-xl border border-white/15 bg-white/5 px-7 py-4 text-center font-semibold transition hover:border-[#0057FF]/50 hover:bg-white/10 md:w-auto"

            >

              Follow us on Instagram →

            </a>

          </div>

        </div>

      </section>



      <Footer />

    </main>

  );

}