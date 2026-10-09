import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventRegistrationForm from "@/components/EventRegistrationForm";

import {
  client,
} from "@/sanity/lib/client";

import {
  EVENT_BY_SLUG_QUERY,
} from "@/sanity/lib/queries";

import type {
  Event,
  EventGalleryImage,
  RegistrationStatus,
} from "@/data/events";

type EventDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;

  searchParams: Promise<{
    payment?:
      | string
      | string[];

    registration?:
      | string
      | string[];
  }>;
};

type SanityPortableBlock = {
  _type?: string;

  children?: {
    text?: string;
  }[];
};

type SanityGalleryImage = {
  url?: string;

  alt?: string;
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

  confirmedRegistrations?:
    number;

  highlights?: string[];

  registrationStatus?:
    | "coming-soon"
    | "open"
    | "closed"
    | "full";

  registrationUrl?: string;

  registrationDeadline?:
    string;

  registrationNote?: string;

  price?: number;

  coverImageUrl?: string;

  coverImageAlt?: string;

  gallery?:
    SanityGalleryImage[];
};

type PaymentRegistration = {
  _id: string;

  status?:
    | "pending-payment"
    | "confirmed"
    | "waitlist"
    | "cancelled"
    | "checked-in";

  paymentStatus?:
    | "not_required"
    | "pay_on_site"
    | "pending"
    | "paid"
    | "failed"
    | "refunded";

  paymentProvider?:
    string;

  paymentRedirectUrl?:
    string;

  reservationExpiresAt?:
    string;

  confirmationEmailSentAt?:
    string;
};

type PaymentNoticeState =
  | "paid"
  | "pending"
  | "cancelled"
  | "unknown";

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
        Boolean(
          paragraph
        )
    );
}

function convertGallery(
  gallery?:
    SanityGalleryImage[]
): EventGalleryImage[] {
  if (!gallery) {
    return [];
  }

  return gallery
    .filter(
      (
        image
      ): image is SanityGalleryImage & {
        url: string;
      } =>
        Boolean(
          image.url
        )
    )
    .map(
      (image) => ({
        url:
          image.url,

        alt:
          image.alt,
      })
    );
}

function convertSanityEvent(
  sanityEvent:
    SanityEvent
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

  const [
    ,
    month,
    day,
  ] =
    sanityEvent.date.split(
      "-"
    );

  const monthIndex =
    Number(month) - 1;

  const fullDescription =
    portableTextToParagraphs(
      sanityEvent
        .fullDescription
    );

  return {
    slug:
      sanityEvent.slug,

    date:
      String(
        Number(day)
      ),

    month:
      monthNames[
        monthIndex
      ] ?? "",

    title:
      sanityEvent.title,

    description:
      sanityEvent
        .description,

    fullDescription:
      fullDescription.length >
      0
        ? fullDescription
        : [
            sanityEvent
              .description,
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
      sanityEvent
        .highlights,

    price:
      sanityEvent.price,

    coverImageUrl:
      sanityEvent
        .coverImageUrl,

    coverImageAlt:
      sanityEvent
        .coverImageAlt,

    gallery:
      convertGallery(
        sanityEvent.gallery
      ),

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
  status:
    RegistrationStatus
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
    new Date(
      deadline
    );

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
      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    parsed
  );
}

function formatPrice(
  price?: number
) {
  if (
    typeof price !==
    "number"
  ) {
    return "To be confirmed";
  }

  if (
    price === 0
  ) {
    return "Free";
  }

  return `${price} CZK`;
}

function getFirstSearchParam(
  value:
    | string
    | string[]
    | undefined
) {
  if (
    Array.isArray(
      value
    )
  ) {
    return value[0];
  }

  return value;
}

function isPaymentReturnValue(
  value?: string
): value is
  | "paid"
  | "pending"
  | "cancelled" {
  return (
    value === "paid" ||
    value === "pending" ||
    value ===
      "cancelled"
  );
}

function getPaymentNoticeState(
  registration:
    PaymentRegistration | null
): PaymentNoticeState {
  if (!registration) {
    return "unknown";
  }

  if (
    registration
      .paymentProvider !==
    "comgate"
  ) {
    return "unknown";
  }

  if (
    registration
      .paymentStatus ===
      "paid" &&
    (
      registration.status ===
        "confirmed" ||
      registration.status ===
        "checked-in"
    )
  ) {
    return "paid";
  }

  if (
    registration.status ===
      "cancelled" ||
    registration
      .paymentStatus ===
      "failed"
  ) {
    return "cancelled";
  }

  if (
    registration.status ===
      "pending-payment" ||
    registration
      .paymentStatus ===
      "pending"
  ) {
    return "pending";
  }

  return "unknown";
}

function PaymentReturnNotice({
  state,
  emailSent,
  paymentUrl,
  reservationExpiresAt,
  refreshHref,
}: {
  state:
    PaymentNoticeState;

  emailSent:
    boolean;

  paymentUrl?:
    string;

  reservationExpiresAt?:
    string;

  refreshHref:
    string;
}) {
  const reservationStillActive =
    reservationExpiresAt
      ? (
          new Date(
            reservationExpiresAt
          ).getTime() >
          Date.now()
        )
      : false;

  if (
    state ===
    "paid"
  ) {
    return (
      <section className="border-b border-white/10 bg-[#091725] px-6 py-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[20px] border border-[#0057FF]/35 bg-[#0D2035] p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
              Payment confirmed
            </p>

            <h2 className="mt-2 text-xl font-semibold md:text-2xl">
              Your place is confirmed.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#A9B5C3]">
              {emailSent
                ? "Your payment was successful and your ticket has been sent to your email."
                : "Your payment was successful and your registration is confirmed. Your ticket email is being prepared."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (
    state ===
    "cancelled"
  ) {
    return (
      <section className="border-b border-white/10 bg-[#091725] px-6 py-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[20px] border border-red-400/25 bg-red-400/10 p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-200">
              Payment cancelled
            </p>

            <h2 className="mt-2 text-xl font-semibold md:text-2xl">
              The payment was not completed.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#A9B5C3]">
              No paid ticket was issued. If places are still available, you can submit the registration form again.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (
    state ===
    "pending"
  ) {
    return (
      <section className="border-b border-white/10 bg-[#091725] px-6 py-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[20px] border border-[#F0B44D]/30 bg-[#F0B44D]/10 p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FFD58A]">
              Payment processing
            </p>

            <h2 className="mt-2 text-xl font-semibold md:text-2xl">
              We are confirming your payment.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#C6B58D]">
              Do not submit another registration yet. Payment confirmation can take a short moment.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={
                  refreshHref
                }
                className="rounded-xl bg-[#0057FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2874FF]"
              >
                Refresh payment status
              </Link>

              {paymentUrl &&
                reservationStillActive && (
                  <a
                    href={
                      paymentUrl
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[#F6F8FB] transition hover:bg-white/10"
                  >
                    Return to payment
                  </a>
                )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-white/10 bg-[#091725] px-6 py-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[20px] border border-white/10 bg-[#0D1D2C] p-5 md:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EA0B3]">
            Payment status
          </p>

          <h2 className="mt-2 text-xl font-semibold md:text-2xl">
            We could not confirm the payment status yet.
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8EA0B3]">
            Do not start a second payment yet. Refresh the status in a moment or check your email for the ticket confirmation.
          </p>

          <Link
            href={
              refreshHref
            }
            className="mt-5 inline-block rounded-xl bg-[#0057FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2874FF]"
          >
            Refresh payment status
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function EventDetailPage({
  params,
  searchParams,
}: EventDetailPageProps) {
  const [
    resolvedParams,
    resolvedSearchParams,
  ] =
    await Promise.all([
      params,
      searchParams,
    ]);

  const {
    slug,
  } =
    resolvedParams;

  const paymentReturnHint =
    getFirstSearchParam(
      resolvedSearchParams
        .payment
    );

  const paymentRegistrationId =
    getFirstSearchParam(
      resolvedSearchParams
        .registration
    );

  const showPaymentNotice =
    isPaymentReturnValue(
      paymentReturnHint
    );

  const sanityEvent =
    await client.fetch<
      SanityEvent | null
    >(
      EVENT_BY_SLUG_QUERY,
      {
        slug,
      }
    );

  if (!sanityEvent) {
    notFound();
  }

  const event =
    convertSanityEvent(
      sanityEvent
    );

  if (!event) {
    notFound();
  }

  const nowIso =
    new Date()
      .toISOString();

  /*
    Active payment reservations
    temporarily occupy capacity.

    This keeps the public "spots left"
    count consistent with the payment
    API and prevents overselling.
  */

  const activePaymentReservationsPromise =
    client.fetch<number>(
      `
        count(
          *[
            _type ==
              "eventRegistration"

            && event._ref ==
              $eventId

            && status ==
              "pending-payment"

            && paymentStatus ==
              "pending"

            && defined(
              reservationExpiresAt
            )

            && reservationExpiresAt >
              $now
          ]
        )
      `,
      {
        eventId:
          sanityEvent._id,

        now:
          nowIso,
      }
    );

  /*
    The query parameters from Comgate
    are NOT trusted as proof of payment.

    If this is a payment return, read
    the real registration state from
    Sanity and require it to belong to
    this exact event.
  */

  const paymentRegistrationPromise:
    Promise<
      PaymentRegistration | null
    > =
    showPaymentNotice &&
    paymentRegistrationId
      ? client.fetch<
          PaymentRegistration | null
        >(
          `
            *[
              _type ==
                "eventRegistration"

              && _id ==
                $registrationId

              && event._ref ==
                $eventId

              && paymentProvider ==
                "comgate"
            ][0] {
              _id,

              status,
              paymentStatus,
              paymentProvider,

              paymentRedirectUrl,
              reservationExpiresAt,

              confirmationEmailSentAt
            }
          `,
          {
            registrationId:
              paymentRegistrationId,

            eventId:
              sanityEvent._id,
          }
        )
      : Promise.resolve(
          null
        );

  const [
    activePaymentReservations,
    paymentRegistration,
  ] =
    await Promise.all([
      activePaymentReservationsPromise,
      paymentRegistrationPromise,
    ]);

  const confirmedRegistrations =
    sanityEvent
      .confirmedRegistrations ??
    0;

  const occupiedRegistrations =
    confirmedRegistrations +
    activePaymentReservations;

  const remainingSpots =
    typeof event.capacity ===
      "number" &&
    event.capacity > 0
      ? Math.max(
          event.capacity -
            occupiedRegistrations,
          0
        )
      : undefined;

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

  const paymentNoticeState =
    getPaymentNoticeState(
      paymentRegistration
    );

  const refreshHref =
    showPaymentNotice &&
    paymentRegistrationId
      ? `/events/${encodeURIComponent(
          slug
        )}?payment=${encodeURIComponent(
          paymentReturnHint
        )}&registration=${encodeURIComponent(
          paymentRegistrationId
        )}`
      : `/events/${encodeURIComponent(
          slug
        )}`;

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
                {
                  event.title
                }
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-[#A9B5C3] md:text-lg md:leading-8">
                {
                  event.description
                }
              </p>
            </div>

            {/* COVER / DATE CARD */}

            <div
              className={`relative min-h-[300px] overflow-hidden rounded-[24px] bg-gradient-to-br ${event.gradient} p-6 md:min-h-[360px] md:p-8`}
              style={
                event.coverImageUrl
                  ? {
                      backgroundImage:
                        `url("${event.coverImageUrl}")`,

                      backgroundPosition:
                        "center",

                      backgroundSize:
                        "cover",
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
                  ? event.coverImageAlt ??
                    event.title
                  : undefined
              }
            >
              {event.coverImageUrl ? (
                <>
                  <div className="absolute inset-0 bg-black/35" />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#071422]/90 via-[#071422]/30 to-transparent" />
                </>
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_30%)]" />
              )}

              <div className="relative flex min-h-[252px] flex-col justify-end md:min-h-[296px]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  Save the date
                </p>

                <div className="mt-5 flex items-end justify-between gap-6">
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

      {/* PAYMENT RETURN */}

      {showPaymentNotice && (
        <PaymentReturnNotice
          state={
            paymentNoticeState
          }
          emailSent={
            Boolean(
              paymentRegistration
                ?.confirmationEmailSentAt
            )
          }
          paymentUrl={
            paymentRegistration
              ?.paymentRedirectUrl
          }
          reservationExpiresAt={
            paymentRegistration
              ?.reservationExpiresAt
          }
          refreshHref={
            refreshHref
          }
        />
      )}

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
                  {
                    event.venue
                  }
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
                  {
                    event.time
                  }
                </p>

                <p className="mt-1 text-sm text-[#71869A]">
                  {
                    event.location
                  }
                </p>
              </div>

              {/* PRICE */}

              <div className="rounded-[18px] border border-white/10 bg-[#0B1A29] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
                  Ticket price
                </p>

                <p className="mt-2 font-semibold">
                  {formatPrice(
                    event.price
                  )}
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

                {typeof remainingSpots ===
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

              <div className="rounded-[18px] border border-white/10 bg-[#0B1A29] p-5 sm:col-span-2">
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

            {/* GALLERY */}

            {event.gallery &&
              event.gallery.length >
                0 && (
                <div className="mt-12">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8EC5FF]">
                    Gallery
                  </p>

                  <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] md:text-3xl">
                    From the event.
                  </h2>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {event.gallery.map(
                      (
                        image,
                        index
                      ) => (
                        <div
                          key={`${image.url}-${index}`}
                          className={`overflow-hidden rounded-[20px] border border-white/10 bg-[#0B1A29] ${
                            index ===
                              0 &&
                            event
                              .gallery!
                              .length %
                              2 ===
                              1
                              ? "sm:col-span-2"
                              : ""
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}

                          <img
                            src={
                              image.url
                            }
                            alt={
                              image.alt ??
                              `${event.title} gallery photo ${
                                index +
                                1
                              }`
                            }
                            loading="lazy"
                            className={`w-full object-cover transition duration-500 hover:scale-[1.02] ${
                              index ===
                                0 &&
                              event
                                .gallery!
                                .length %
                                2 ===
                                1
                                ? "aspect-[16/8]"
                                : "aspect-[4/3]"
                            }`}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* RIGHT / REGISTRATION */}

          <aside className="self-start lg:sticky lg:top-24">
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
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}