import Link from "next/link";
import { notFound } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventRegistrationForm from "@/components/EventRegistrationForm";

import { client } from "@/sanity/lib/client";

import {
  events as localEvents,
  type Event,
  type RegistrationStatus,
} from "@/data/events";

const EVENT_BY_SLUG_QUERY = `
  *[
    _type == "event"
    && slug.current == $slug
  ][0] {
    _id,
    title,
    "slug": slug.current,
    label,
    status,
    date,
    time,
    location,
    venue,
    address,
    description,

    fullDescription[] {
      _type,
      children[] {
        text
      }
    },

    capacity,
    highlights,
    registrationStatus,
    registrationUrl,
    registrationDeadline,
    registrationNote,

    "confirmedRegistrations": count(
      *[
        _type == "eventRegistration"
        && event._ref == ^._id
        && status in [
          "confirmed",
          "checked-in"
        ]
      ]
    )
  }
`;

type EventDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type SanityPortableBlock = {
  _type?: string;

  children?: {
    text?: string;
  }[];
};

type SanityEvent = {
  _id: string;

  title?: string;
  slug?: string;

  label?: string;

  status?:
    | "upcoming"
    | "past";

  date?: string;
  time?: string;

  location?: string;
  venue?: string;
  address?: string;

  description?: string;

  fullDescription?:
    SanityPortableBlock[];

  capacity?: number;

  confirmedRegistrations?: number;

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

function getGradient(
  label?: string
) {
  switch (label) {
    case "EXPLORE":
      return "from-[#164B64] via-[#1D596B] to-[#163449]";

    case "COMMUNITY":
      return "from-[#343064] via-[#243A66] to-[#10243A]";

    default:
      return "from-[#0057FF] via-[#164EA6] to-[#102B4C]";
  }
}

function portableTextToParagraphs(
  blocks?: SanityPortableBlock[]
) {
  if (!blocks) {
    return [];
  }

  return blocks
    .map((block) =>
      block.children
        ?.map(
          (child) =>
            child.text ?? ""
        )
        .join("")
        .trim()
    )
    .filter(
      (
        paragraph
      ): paragraph is string =>
        Boolean(paragraph)
    );
}

function convertSanityEvent(
  sanityEvent: SanityEvent
): Event | null {
  if (
    !sanityEvent.title ||
    !sanityEvent.slug ||
    !sanityEvent.date ||
    !sanityEvent.time ||
    !sanityEvent.location ||
    !sanityEvent.description
  ) {
    return null;
  }

  const [, month, day] =
    sanityEvent.date.split("-");

  const monthIndex =
    Number(month) - 1;

  const fullDescription =
    portableTextToParagraphs(
      sanityEvent.fullDescription
    );

  return {
    slug:
      sanityEvent.slug,

    date:
      String(Number(day)),

    month:
      monthNames[
        monthIndex
      ] ?? "",

    title:
      sanityEvent.title,

    description:
      sanityEvent.description,

    fullDescription:
      fullDescription.length > 0
        ? fullDescription
        : [
            sanityEvent.description,
          ],

    location:
      sanityEvent.location,

    venue:
      sanityEvent.venue ??
      "Venue to be announced",

    address:
      sanityEvent.address,

    time:
      sanityEvent.time,

    gradient:
      getGradient(
        sanityEvent.label
      ),

    label:
      sanityEvent.label ??
      "EVENT",

    status:
      sanityEvent.status ??
      "upcoming",

    capacity:
      sanityEvent.capacity,

    highlights:
      sanityEvent.highlights,

    registration: {
      status:
        sanityEvent
          .registrationStatus ??
        "coming-soon",

      url:
        sanityEvent
          .registrationUrl,

      deadline:
        sanityEvent
          .registrationDeadline,

      note:
        sanityEvent
          .registrationNote,
    },
  };
}

function getRegistrationInfo(
  status: RegistrationStatus
) {
  switch (status) {
    case "open":
      return {
        label:
          "Registration open",

        button:
          "Register now →",
      };

    case "full":
      return {
        label:
          "Waitlist open",

        button:
          "Join waitlist",
      };

    case "closed":
      return {
        label:
          "Registration closed",

        button:
          "Registration closed",
      };

    default:
      return {
        label:
          "Coming soon",

        button:
          "Registration coming soon",
      };
  }
}

function formatDeadline(
  deadline?: string
) {
  if (!deadline) {
    return undefined;
  }

  const parsed =
    new Date(deadline);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return deadline;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(parsed);
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } =
    await params;

  /*
    1. Nejprve hledáme event
       v Sanity.
  */

  const sanityEvent =
    await client.fetch<
      SanityEvent | null
    >(
      EVENT_BY_SLUG_QUERY,
      {
        slug,
      }
    );

  /*
    2. Pokud je v Sanity,
       převedeme ho do stejného
       formátu, jaký používá web.

    3. Pokud v Sanity ještě není,
       použijeme data/events.ts.
  */

  const cmsEvent =
    sanityEvent
      ? convertSanityEvent(
          sanityEvent
        )
      : null;

  const localEvent =
    localEvents.find(
      (item) =>
        item.slug === slug
    );

  const event =
    cmsEvent ??
    localEvent;

  if (!event) {
    notFound();
  }

  /*
    LIVE CAPACITY

    confirmed + checked-in
    registrations zabírají místo.
  */

  const confirmedRegistrations =
    sanityEvent
      ?.confirmedRegistrations ??
    0;

  const remainingSpots =
    typeof event.capacity ===
      "number" &&
    event.capacity > 0
      ? Math.max(
          event.capacity -
            confirmedRegistrations,
          0
        )
      : undefined;

  /*
    Pokud je event v CMS stále
    označen jako "open", ale podle
    reálných registrací už nemá
    volné místo, přepneme UI
    automaticky do waitlist režimu.
  */

  const effectiveRegistrationStatus:
    RegistrationStatus =
    event.registration.status ===
      "open" &&
    typeof remainingSpots ===
      "number" &&
    remainingSpots <= 0
      ? "full"
      : event.registration.status;

  const registration =
    getRegistrationInfo(
      effectiveRegistrationStatus
    );

  const formattedDeadline =
    formatDeadline(
      event.registration
        .deadline
    );

  /*
    Interní registration flow
    funguje pouze pro event,
    který existuje v Sanity.

    Local fallback zatím dál
    používá původní URL.
  */

  const hasInternalRegistration =
    Boolean(
      sanityEvent &&
        cmsEvent
    );

  const legacyRegistrationIsOpen =
    !hasInternalRegistration &&
    effectiveRegistrationStatus ===
      "open" &&
    Boolean(
      event.registration.url
    );

  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      {/* HERO */}

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-14 md:py-20 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,87,255,0.16),transparent_34%)]" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/events"
            className="text-sm text-[#8EA0B3] transition hover:text-white"
          >
            ← Back to events
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end lg:gap-12">
            {/* LEFT */}

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8EC5FF]">
                  {event.label}
                </span>

                <span className="text-sm text-[#71869A]">
                  {event.status ===
                  "upcoming"
                    ? "Upcoming event"
                    : "Past event"}
                </span>
              </div>

              <h1 className="mt-5 max-w-4xl text-[42px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl md:text-7xl">
                {event.title}
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-[#A9B5C3] md:text-lg md:leading-8">
                {
                  event.description
                }
              </p>
            </div>

            {/* DATE CARD */}

            <div
              className={`relative overflow-hidden rounded-[24px] bg-gradient-to-br ${event.gradient} p-6 md:p-8`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_30%)]" />

              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  Save the date
                </p>

                <div className="mt-6 flex items-end justify-between gap-6">
                  <div>
                    <p className="text-lg font-semibold text-[#8EC5FF]">
                      {
                        event.month
                      }
                    </p>

                    <p className="text-6xl font-bold leading-none">
                      {
                        event.date
                      }
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {
                        event.time
                      }
                    </p>

                    <p className="mt-1 text-sm text-white/70">
                      {
                        event.location
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}

      <section className="px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.65fr] lg:gap-12">
          {/* LEFT */}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF]">
              Event details
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-4xl">
              Everything you need
              to know.
            </h2>

            {/* DESCRIPTION */}

            <div className="mt-6 space-y-4">
              {event.fullDescription.map(
                (
                  paragraph,
                  index
                ) => (
                  <p
                    key={
                      index
                    }
                    className="max-w-3xl leading-7 text-[#A9B5C3]"
                  >
                    {
                      paragraph
                    }
                  </p>
                )
              )}
            </div>

            {/* QUICK INFO */}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-white/10 bg-[#0B1A29] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
                  Venue
                </p>

                <p className="mt-2 font-semibold">
                  {event.venue}
                </p>

                {event.address && (
                  <p className="mt-1 text-sm text-[#71869A]">
                    {
                      event.address
                    }
                  </p>
                )}
              </div>

              <div className="rounded-[18px] border border-white/10 bg-[#0B1A29] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
                  Time
                </p>

                <p className="mt-2 font-semibold">
                  {event.time}
                </p>

                <p className="mt-1 text-sm text-[#71869A]">
                  {
                    event.location
                  }
                </p>
              </div>

              {/* CAPACITY */}

              <div className="rounded-[18px] border border-white/10 bg-[#0B1A29] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
                  Capacity
                </p>

                <p className="mt-2 font-semibold">
                  {event.capacity
                    ? `${event.capacity} people`
                    : "To be confirmed"}
                </p>

                {hasInternalRegistration &&
                  typeof remainingSpots ===
                    "number" && (
                    <p
                      className={`mt-1 text-sm ${
                        remainingSpots >
                        0
                          ? "text-[#8EC5FF]"
                          : "text-[#71869A]"
                      }`}
                    >
                      {remainingSpots >
                      0
                        ? `${remainingSpots} ${
                            remainingSpots ===
                            1
                              ? "spot"
                              : "spots"
                          } left`
                        : "Waitlist only"}
                    </p>
                  )}
              </div>

              {/* REGISTRATION */}

              <div className="rounded-[18px] border border-white/10 bg-[#0B1A29] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
                  Registration
                </p>

                <p className="mt-2 font-semibold">
                  {
                    registration.label
                  }
                </p>

                {formattedDeadline && (
                  <p className="mt-1 text-sm text-[#71869A]">
                    Deadline:{" "}
                    {
                      formattedDeadline
                    }
                  </p>
                )}
              </div>
            </div>

            {/* HIGHLIGHTS */}

            {event.highlights &&
              event.highlights
                .length > 0 && (
                <div className="mt-10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8EC5FF]">
                    What to expect
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {event.highlights.map(
                      (
                        highlight,
                        index
                      ) => (
                        <div
                          key={
                            highlight
                          }
                          className="rounded-[18px] border border-white/10 bg-[#0D1D2C] p-5"
                        >
                          <span className="text-xs font-semibold text-[#5790FF]">
                            {String(
                              index +
                                1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <p className="mt-4 font-medium">
                            {
                              highlight
                            }
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* RIGHT / REGISTRATION */}

          <aside className="self-start lg:sticky lg:top-24">
            {hasInternalRegistration ? (
              <EventRegistrationForm
                eventSlug={
                  event.slug
                }
                eventTitle={
                  event.title
                }
                registrationStatus={
                  effectiveRegistrationStatus
                }
                capacity={
                  event.capacity
                }
              />
            ) : (
              /*
                Legacy fallback pro eventy,
                které ještě nejsou v Sanity.
              */

              <div className="rounded-[24px] border border-[#0057FF]/30 bg-[#0D2035] p-6 md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
                    Registration
                  </p>

                  <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8EC5FF]">
                    {
                      registration.label
                    }
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-semibold">
                  Want to join?
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#A9B5C3] md:text-base md:leading-7">
                  {event
                    .registration
                    .note ??
                    "Registration information will appear here."}
                </p>

                {formattedDeadline && (
                  <div className="mt-5 rounded-xl border border-white/10 bg-[#071422]/60 p-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#71869A]">
                      Registration
                      deadline
                    </p>

                    <p className="mt-2 font-semibold">
                      {
                        formattedDeadline
                      }
                    </p>
                  </div>
                )}

                {legacyRegistrationIsOpen ? (
                  <a
                    href={
                      event
                        .registration
                        .url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 block w-full rounded-xl bg-[#0057FF] px-5 py-3.5 text-center font-semibold transition hover:bg-[#2874FF]"
                  >
                    {
                      registration.button
                    }
                  </a>
                ) : (
                  <div className="mt-6 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-center font-semibold text-[#71869A]">
                    {
                      registration.button
                    }
                  </div>
                )}

                <p className="mt-4 text-xs leading-5 text-[#53687D]">
                  Event details may
                  change. Check this
                  page again before
                  the event for the
                  latest information.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}