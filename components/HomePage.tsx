import Link from "next/link";

import Navbar from "@/components/Navbar";

import Footer from "@/components/Footer";

import HomepageHero from "@/components/HomepageHero";

import HomepageExplore from "@/components/HomepageExplore";

import type { Event } from "@/data/events";

import type { Place } from "@/data/places";
import { studyHighlights } from "@/data/study";

type HomePageProps = {

  events: Pick<Event,
    "coverImageAlt" | "coverImageUrl" | "date" | "description" | "gradient" |
    "label" | "location" | "month" | "price" | "slug" | "time" | "title"
  >[];

  places: Place[];

  heroImageUrl?: string;

  heroImageAlt?: string;

};

export default function HomePage({

  events: upcomingEvents,

  places,

  heroImageUrl,

  heroImageAlt,

}: HomePageProps) {

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

      <HomepageExplore places={places} />

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

                See what’s happening in

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
