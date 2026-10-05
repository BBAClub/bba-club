import Link from "next/link";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { client } from "@/sanity/lib/client";
import { EVENTS_QUERY } from "@/sanity/lib/queries";

import {
  events as localEvents,
  type Event,
} from "@/data/events";

/*
  Stránka se nebude držet staré statické verze.
  Díky tomu se rozdělení Upcoming / Past přepočítá
  podle aktuálního dne při načtení stránky.
*/
export const dynamic = "force-dynamic";

type SanityEvent = {
  _id: string;
  title: string;
  slug: string;
  label?: string;
  status?: "upcoming" | "past";
  date?: string;
  time?: string;
  location?: string;
  venue?: string;
  address?: string;
  description?: string;
  capacity?: number;
  highlights?: string[];
  registrationStatus?:
    | "coming-soon"
    | "open"
    | "closed"
    | "full";
  registrationUrl?: string;
  registrationDeadline?: string;
  registrationNote?: string;
};

/*
  Event používaný přímo na této stránce.

  isoDate uchovává celé datum ze Sanity:
  například "2026-10-15".

  To potřebujeme pro automatické rozdělování
  Upcoming / Past.
*/
type DisplayEvent = Event & {
  isoDate?: string;
};

const monthNames = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function getGradient(label?: string) {
  switch (label) {
    case "EXPLORE":
      return "from-[#164B64] via-[#1D596B] to-[#163449]";

    case "COMMUNITY":
      return "from-[#343064] via-[#243A66] to-[#10243A]";

    default:
      return "from-[#0057FF] via-[#164EA6] to-[#102B4C]";
  }
}

/*
  Vrátí dnešní datum v Praze ve formátu YYYY-MM-DD.

  Používáme Prague timezone, aby se event nepřesunul
  do Past Events podle UTC o několik hodin dříve / později.
*/
function getTodayInPrague() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  if (!year || !month || !day) {
    return new Date()
      .toISOString()
      .slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function convertSanityEvent(
  event: SanityEvent
): DisplayEvent | null {
  if (
    !event.title ||
    !event.slug ||
    !event.date ||
    !event.time ||
    !event.location ||
    !event.description
  ) {
    return null;
  }

  const [, month, day] =
    event.date.split("-");

  const monthIndex = Number(month) - 1;

  return {
    slug: event.slug,

    /*
      Pro kartu stále používáme samostatný den + měsíc.
    */
    date: String(Number(day)),
    month: monthNames[monthIndex] ?? "",

    /*
      Celé datum si ale zároveň zachováme
      pro filtrování a řazení.
    */
    isoDate: event.date,

    title: event.title,

    description: event.description,

    fullDescription: [
      event.description,
    ],

    location: event.location,

    venue:
      event.venue ??
      "Venue to be announced",

    address: event.address,

    time: event.time,

    gradient: getGradient(event.label),

    label: event.label ?? "EVENT",

    /*
      Status zde necháváme kvůli typu Event
      a případné kompatibilitě se zbytkem webu.

      Pro Sanity eventy ale Upcoming / Past
      určujeme níže výhradně podle data.
    */
    status:
      event.status ?? "upcoming",

    capacity: event.capacity,

    highlights: event.highlights,

    registration: {
      status:
        event.registrationStatus ??
        "coming-soon",

      url: event.registrationUrl,

      deadline:
        event.registrationDeadline,

      note: event.registrationNote,
    },
  };
}

function EventCard({
  event,
}: {
  event: DisplayEvent;
}) {
  return (
    <article
      className="group overflow-hidden rounded-[20px] border border-white/10 bg-[#0D1D2C] transition duration-300 hover:border-[#0057FF]/50 md:rounded-[24px] md:hover:-translate-y-1"
    >
      {/* DESKTOP COVER */}
      <div
        className={`relative hidden h-48 bg-gradient-to-br ${event.gradient} p-6 md:block`}
      >
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

      {/* CONTENT */}
      <div className="relative p-5 md:p-6">
        {/* MOBILE ACCENT */}
        <div
          className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${event.gradient} md:hidden`}
        />

        {/* MOBILE TOP */}
        <div className="mb-4 flex items-start justify-between gap-4 md:hidden">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#A9CFFF]">
            {event.label}
          </span>

          <div className="flex shrink-0 items-baseline gap-1.5">
            <span className="text-[11px] font-semibold text-[#8EC5FF]">
              {event.month}
            </span>

            <span className="text-lg font-bold leading-none">
              {event.date}
            </span>
          </div>
        </div>

        <h3 className="text-xl font-semibold md:text-2xl">
          {event.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-[#8EA0B3] md:mt-3 md:min-h-[48px] md:text-base">
          {event.description}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4 md:mt-6 md:pt-5">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#A9B5C3] md:text-sm">
            <span>
              ⌖ {event.location}
            </span>

            <span>
              ◷ {event.time}
            </span>
          </div>

          <Link
            href={`/events/${event.slug}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#5790FF] transition hover:bg-[#0057FF] hover:text-white md:hidden"
            aria-label={`View details for ${event.title}`}
          >
            →
          </Link>
        </div>

        <Link
          href={`/events/${event.slug}`}
          className="mt-6 hidden w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center font-semibold transition hover:border-[#0057FF]/50 hover:bg-[#0057FF] md:block"
        >
          Event details →
        </Link>
      </div>
    </article>
  );
}

export default async function EventsPage() {
  const sanityEvents =
    await client.fetch<SanityEvent[]>(
      EVENTS_QUERY
    );

  const convertedSanityEvents =
    sanityEvents
      .map(convertSanityEvent)
      .filter(
        (
          event
        ): event is DisplayEvent =>
          event !== null
      );

  /*
    Přechodový režim:

    Sanity event přepíše lokální event
    se stejným slugem.

    Eventy, které ještě nejsou v Sanity,
    zůstanou z data/events.ts.
  */
  const cmsSlugs = new Set(
    convertedSanityEvents.map(
      (event) => event.slug
    )
  );

  const remainingLocalEvents:
    DisplayEvent[] =
    localEvents.filter(
      (event) =>
        !cmsSlugs.has(event.slug)
    );

  const events: DisplayEvent[] = [
    ...convertedSanityEvents,
    ...remainingLocalEvents,
  ];

  const today = getTodayInPrague();

  /*
    SANITY EVENTY:
    Rozdělují se automaticky podle isoDate.

    LOKÁLNÍ EVENTY:
    Zatím používají starý status,
    dokud je nepřesuneme do Sanity.
  */
  const upcomingEvents = events
    .filter((event) => {
      if (event.isoDate) {
        return event.isoDate >= today;
      }

      return event.status !== "past";
    })
    .sort((a, b) => {
      if (
        a.isoDate &&
        b.isoDate
      ) {
        return a.isoDate.localeCompare(
          b.isoDate
        );
      }

      if (a.isoDate) return -1;
      if (b.isoDate) return 1;

      return 0;
    });

  const pastEvents = events
    .filter((event) => {
      if (event.isoDate) {
        return event.isoDate < today;
      }

      return event.status === "past";
    })
    .sort((a, b) => {
      if (
        a.isoDate &&
        b.isoDate
      ) {
        return b.isoDate.localeCompare(
          a.isoDate
        );
      }

      if (a.isoDate) return -1;
      if (b.isoDate) return 1;

      return 0;
    });

  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 py-14 md:py-20 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,87,255,0.16),transparent_34%)]" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
            BBA Club · Events
          </p>

          <h1 className="mt-4 max-w-4xl text-[42px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl md:mt-5 md:text-7xl">
            Meet people.
            <br />

            <span className="text-[#0057FF]">
              Do something memorable.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-[#A9B5C3] md:mt-7 md:text-lg md:leading-8">
            Socials, trips, workshops and
            everything in between. Find out
            what&apos;s happening next.
          </p>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 md:mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
              What&apos;s next
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Upcoming Events
            </h2>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {upcomingEvents.map(
                (event) => (
                  <EventCard
                    key={event.slug}
                    event={event}
                  />
                )
              )}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/15 bg-white/[0.02] p-7 text-center md:rounded-[28px] md:p-12">
              <p className="font-medium md:text-lg">
                No upcoming events yet.
              </p>

              <p className="mt-2 text-sm text-[#71869A]">
                New events will appear here
                soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* PAST EVENTS */}
      <section className="border-t border-white/10 bg-[#091725] px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
            Good times
          </p>

          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Past Events
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-6 text-[#A9B5C3] md:text-base">
            As BBA Club grows, this will
            become the archive of everything
            we&apos;ve done together.
          </p>

          {pastEvents.length > 0 ? (
            <div className="mt-7 grid gap-4 md:mt-10 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {pastEvents.map(
                (event) => (
                  <EventCard
                    key={event.slug}
                    event={event}
                  />
                )
              )}
            </div>
          ) : (
            <div className="mt-7 rounded-[22px] border border-dashed border-white/15 bg-white/[0.02] p-7 text-center md:mt-10 md:rounded-[28px] md:p-12">
              <p className="font-medium md:text-lg">
                Past events will appear here.
              </p>

              <p className="mt-2 text-sm text-[#71869A]">
                Photos and event recaps can
                be added later.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}