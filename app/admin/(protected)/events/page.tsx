import Link from "next/link";

import {
  client,
} from "@/sanity/lib/client";

export const dynamic =
  "force-dynamic";

type AdminEvent = {
  _id: string;

  title: string;
  slug: string;

  label?: string;
  status?: string;

  date?: string;
  time?: string;

  location?: string;
  venue?: string;

  capacity?: number;
  price?: number;
  currency?: string;

  registrationStatus?: string;

  coverImageUrl?: string;

  registeredCount: number;
  waitlistCount: number;
  checkedInCount: number;
};

const ADMIN_EVENTS_QUERY = `
  *[
    _type == "event"
    && defined(slug.current)
  ]
  | order(date desc) {
    _id,
    title,

    "slug":
      slug.current,

    label,
    status,

    date,
    time,

    location,
    venue,

    capacity,
    price,
    currency,

    registrationStatus,

    "coverImageUrl":
      coverImage.asset->url,

    "registeredCount":
      count(
        *[
          _type == "eventRegistration"
          && event._ref == ^._id
          && status in [
            "confirmed",
            "checked-in"
          ]
        ]
      ),

    "waitlistCount":
      count(
        *[
          _type == "eventRegistration"
          && event._ref == ^._id
          && status == "waitlist"
        ]
      ),

    "checkedInCount":
      count(
        *[
          _type == "eventRegistration"
          && event._ref == ^._id
          && status == "checked-in"
        ]
      )
  }
`;

function formatDate(
  date?: string
) {
  if (!date) {
    return "Date not set";
  }

  const parsed =
    new Date(
      `${date}T12:00:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(parsed);
}

function registrationStatusClasses(
  status?: string
) {
  switch (status) {
    case "open":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "full":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "closed":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    default:
      return "border-white/10 bg-white/[0.04] text-[#8EA0B3]";
  }
}

function registrationStatusLabel(
  status?: string
) {
  switch (status) {
    case "open":
      return "Open";

    case "closed":
      return "Closed";

    case "full":
      return "Full";

    case "coming-soon":
      return "Coming soon";

    default:
      return "Unknown";
  }
}

export default async function EventsPage() {
  const events =
    await client.fetch<
      AdminEvent[]
    >(
      ADMIN_EVENTS_QUERY
    );

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const upcomingCount =
    events.filter(
      (event) =>
        Boolean(
          event.date &&
            event.date >= today
        )
    ).length;

  const openCount =
    events.filter(
      (event) =>
        event.registrationStatus ===
        "open"
    ).length;

  const totalRegistrations =
    events.reduce(
      (
        total,
        event
      ) =>
        total +
        event.registeredCount,
      0
    );

  return (
    <div>
      <style>{`
        .admin-events-header {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .admin-create-event-button {
          width: 100%;
        }

        .admin-event-card-layout {
          display: flex;
          flex-direction: column;
        }

        .admin-event-card-image {
          position: relative;
          width: 100%;
          height: 13rem;
          flex-shrink: 0;
          overflow: hidden;
          background: #091725;
        }

        @media (min-width: 900px) {
          .admin-events-header {
            flex-direction: row;
            align-items: flex-end;
            justify-content: space-between;
          }

          .admin-create-event-button {
            width: auto;
          }

          .admin-event-card-layout {
            display: grid;
            grid-template-columns: 20rem minmax(0, 1fr);
          }

          .admin-event-card-image {
            width: 20rem;
            height: 100%;
            min-height: 15rem;
          }
        }
      `}</style>

      <div className="admin-events-header">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8EC5FF]">
            Events
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white md:text-5xl">
            Event management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8EA0B3]">
            Create, edit and manage
            BBA Club events.
          </p>
        </div>

        <Link
          href="/admin/events/new"
          className="admin-create-event-button inline-flex items-center justify-center gap-2 rounded-xl bg-[#0057FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2874FF]"
        >
          <span className="text-lg leading-none">
            +
          </span>

          Create event
        </Link>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
            Upcoming
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {upcomingCount}
          </p>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
            Registration open
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {openCount}
          </p>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
            Total registrations
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {totalRegistrations}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#71869A]">
              All events
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              {events.length}{" "}
              {events.length === 1
                ? "event"
                : "events"}
            </h2>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-[#0B1A29] px-6 py-14 text-center">
            <p className="font-semibold text-white">
              No events yet
            </p>

            <p className="mt-2 text-sm text-[#71869A]">
              Create your first
              BBA Club event.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {events.map(
              (event) => {
                const capacity =
                  typeof event.capacity ===
                  "number"
                    ? event.capacity
                    : undefined;

                const occupancy =
                  capacity
                    ? Math.min(
                        100,
                        Math.round(
                          (
                            event.registeredCount /
                            capacity
                          ) *
                            100
                        )
                      )
                    : 0;

                const place =
                  event.venue ||
                  event.location ||
                  "Venue not set";

                const currency =
                  event.currency ===
                  "EUR"
                    ? "EUR"
                    : "CZK";

                return (
                  <article
                    key={event._id}
                    className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0B1A29]"
                  >
                    <div className="admin-event-card-layout">
                      <div className="admin-event-card-image">
                        {event.coverImageUrl ? (
                          <img
                            src={
                              event.coverImageUrl
                            }
                            alt={
                              event.title
                            }
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-xl text-[#53687D]">
                              ◫
                            </div>

                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#53687D]">
                              No cover image
                            </span>
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071422]/50 via-transparent to-transparent" />
                      </div>

                      <div className="min-w-0 p-5 md:p-6">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${registrationStatusClasses(
                                  event.registrationStatus
                                )}`}
                              >
                                {registrationStatusLabel(
                                  event.registrationStatus
                                )}
                              </span>

                              {event.label && (
                                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#71869A]">
                                  {
                                    event.label
                                  }
                                </span>
                              )}
                            </div>

                            <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-white md:text-2xl">
                              {
                                event.title
                              }
                            </h3>

                            <p className="mt-2 text-sm text-[#71869A]">
                              {formatDate(
                                event.date
                              )}

                              {event.time
                                ? ` · ${event.time}`
                                : ""}

                              {place
                                ? ` · ${place}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Link
                              href={`/events/${event.slug}`}
                              target="_blank"
                              className="rounded-xl border border-white/10 px-3.5 py-2.5 text-xs font-semibold text-[#A9B5C3] transition hover:border-white/20 hover:text-white"
                            >
                              View
                            </Link>

                            <Link
                              href={`/admin/events/${event.slug}`}
                              className="rounded-xl border border-white/10 px-3.5 py-2.5 text-xs font-semibold text-[#A9B5C3] transition hover:border-white/20 hover:text-white"
                            >
                              Edit
                            </Link>

                            <Link
                              href="/admin/registrations"
                              className="rounded-xl bg-[#0057FF]/10 px-3.5 py-2.5 text-xs font-semibold text-[#8EC5FF] transition hover:bg-[#0057FF]/20"
                            >
                              Registrations
                            </Link>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl border border-white/[0.07] bg-[#071422]/60 px-4 py-3">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#53687D]">
                              Registered
                            </p>

                            <p className="mt-1.5 font-semibold text-white">
                              {
                                event.registeredCount
                              }

                              {capacity
                                ? ` / ${capacity}`
                                : ""}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/[0.07] bg-[#071422]/60 px-4 py-3">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#53687D]">
                              Waitlist
                            </p>

                            <p className="mt-1.5 font-semibold text-white">
                              {
                                event.waitlistCount
                              }
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/[0.07] bg-[#071422]/60 px-4 py-3">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#53687D]">
                              Checked in
                            </p>

                            <p className="mt-1.5 font-semibold text-white">
                              {
                                event.checkedInCount
                              }
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/[0.07] bg-[#071422]/60 px-4 py-3">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#53687D]">
                              Price
                            </p>

                            <p className="mt-1.5 font-semibold text-white">
                              {event.price ===
                              0
                                ? "Free"
                                : typeof event.price ===
                                    "number"
                                  ? `${event.price} ${currency}`
                                  : "Not set"}
                            </p>
                          </div>
                        </div>

                        {capacity && (
                          <div className="mt-5">
                            <div className="mb-2 flex justify-between text-[10px] text-[#53687D]">
                              <span>
                                Capacity
                              </span>

                              <span>
                                {
                                  event.registeredCount
                                }{" "}
                                /{" "}
                                {
                                  capacity
                                }
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                              <div
                                className="h-full rounded-full bg-[#0057FF]"
                                style={{
                                  width:
                                    `${occupancy}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}
