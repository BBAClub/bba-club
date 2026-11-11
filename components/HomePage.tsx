import Image from "next/image";
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
    "coverImageAlt" | "coverImageUrl" | "date" | "description" |
    "label" | "location" | "month" | "price" | "slug" | "time" | "title"
  >[];

  showPastEvents: boolean;
  hasStudyResources: boolean;

  places: Place[];

  heroImageUrl?: string;

  heroImageAlt?: string;

};

export default function HomePage({

  events,

  showPastEvents,
  hasStudyResources,

  places,

  heroImageUrl,

  heroImageAlt,

}: HomePageProps) {

  return (

    <main className="club-home min-h-screen bg-[#071422] text-[#F6F8FB]">

      <Navbar />

      {/* HERO */}

      <HomepageHero

        heroImageUrl={heroImageUrl}

        heroImageAlt={heroImageAlt}

      />

      {/* EVENTS */}

      <section

        id="events" style={{ scrollMarginTop: "5.5rem" }}

        className="border-t border-white/10 bg-[#091725] club-section"

      >

        <div className="club-shell">

          <div className="mb-8 flex items-end justify-between gap-8 sm:mb-10">

            <div>

              <h2 className="club-section-title">

                {showPastEvents ? "Past Events" : "Upcoming Events"}

              </h2>

              <p className="mt-3 text-[#A9B5C3]">

                {showPastEvents
                  ? "See what we’ve been up to at BBA Club."
                  : "Meet people, try something new and make the most of student life."}

              </p>

            </div>

            <Link

              href="/events"

              className="text-sm font-semibold text-[#8EC5FF] underline-offset-4 hover:underline hover:text-white"

            >

              View all events →

            </Link>

          </div>

          {events.length > 0 ? (

            <div className="divide-y divide-white/15 border-y border-white/15">
              {events.map(event => (
                <article key={event.slug} className="grid gap-x-6 gap-y-4 py-6 sm:grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-[5rem_minmax(0,1fr)_15rem]">
                  <p className="flex items-baseline gap-2 text-[#8EC5FF] sm:flex-col sm:gap-1">
                    <span className="text-3xl font-bold leading-none tabular-nums">{event.date}</span>
                    <span className="text-sm font-semibold">{event.month}</span>
                  </p>
                  <div className="min-w-0">
                    <p className="mb-2 text-sm text-[#8EC5FF]">{event.label}</p>
                    <h3 className="text-xl font-semibold leading-tight sm:text-2xl">
                      <Link href={`/events/${event.slug}`} className="underline-offset-4 hover:underline">
                        {event.title}
                      </Link>
                    </h3>
                    <p className="mt-2 max-w-[65ch] text-sm leading-6 text-[#A9B5C3]">
                      {event.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#A9B5C3]">
                      <span>{event.location}</span>
                      <span>{event.time}</span>
                      {event.price !== undefined && (
                        <span className="font-semibold text-[#8EC5FF]">
                          {event.price === 0 ? "Free" : `${event.price} CZK`}
                        </span>
                      )}
                    </div>
                  </div>
                  {event.coverImageUrl && (
                    <div className="relative aspect-[16/9] overflow-hidden rounded-lg sm:col-start-2 lg:col-start-3">
                      <Image src={event.coverImageUrl} alt={event.coverImageAlt ?? ""} fill
                        sizes="(min-width: 1024px) 240px, (min-width: 640px) 75vw, 90vw"
                        className="object-cover" />
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (

            <div className="border-t border-white/15 py-5">

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

      {hasStudyResources && (

      <section

        id="study"

        className="border-t border-white/10 bg-[#091725] club-section"

      >

        <div className="club-shell">

          <div className="mb-8 flex flex-col justify-between gap-5 sm:mb-10 md:flex-row md:items-end">

            <div>

              <h2 className="club-section-title">

                Study Hub

              </h2>

              <p className="club-intro mt-3 text-[#A9B5C3]">

                Everything that can make

                studying at VŠE a little

                easier — gathered in one

                place.

              </p>

            </div>

            <Link

              href="/study"

              className="text-sm font-semibold text-[#8EC5FF] underline-offset-4 hover:underline hover:text-white"

            >

              Explore all resources →

            </Link>

          </div>

          <div className="grid gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-4">

            {studyHighlights.map(

              (item) => {

                const isGreen =

                  item.accent === "green";

                return (

                  <article

                    key={item.title}

                    className="border-t border-white/15 py-5"

                  >

                    <div>
                      <h3 className="text-lg font-semibold md:text-xl">

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

      )}

      {/* ABOUT */}

      <section

        id="about"

        className="relative overflow-hidden border-t border-white/10 bg-[#071422] club-section"

      >


        <div className="club-shell relative">

          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">

            <div>

              <h2 className="club-section-title">

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

                  className="border-t border-white/15 py-4"

                >

                  <h3 className="text-xl font-semibold sm:text-2xl">

                    {value.title}

                  </h3>

                  <p className="mt-3 leading-7 text-[#8EA0B3]">

                    {value.text}

                  </p>

                </div>

              ))}

              <div className="border-t border-white/15 py-4">

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

          <div className="mt-12 flex flex-col justify-between gap-6 border-t border-white/15 py-6 md:mt-16 md:flex-row md:items-center md:gap-8">

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
