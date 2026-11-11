import { trustedRequest } from "@/lib/admin/security";
import { NextResponse } from "next/server";

import { client } from "@/sanity/lib/client";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export const runtime = "nodejs";

type RegistrationStatus =
  | "pending-payment"
  | "confirmed"
  | "waitlist"
  | "cancelled"
  | "checked-in";

type PaymentStatus =
  | "not_required"
  | "pay_on_site"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

type EmailDeliveryStatus =
  | "not-sent"
  | "sent"
  | "delivered"
  | "bounced"
  | "complained"
  | "failed";

type RequestBody = {
  action?: unknown;
  eventId?: unknown;
  page?: unknown;
  search?: unknown;
  status?: unknown;
};

type EventDocument = {
  _id: string;

  title?: string;
  slug?: string;

  date?: string;
  time?: string;

  venue?: string;
  location?: string;

  capacity?: number;

  price?: number;
  currency?: "CZK" | "EUR";

  onlinePaymentsEnabled?: boolean;

  registrationStatus?:
    | "coming-soon"
    | "open"
    | "closed"
    | "full";
};

type RegistrationDocument = {
  _id: string;

  eventId?: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  university?: string;
  note?: string;

  status?: RegistrationStatus;

  ticketCode?: string;

  registeredAt?: string;
  checkedInAt?: string;

  /*
    PAYMENT
  */

  paymentStatus?: PaymentStatus;

  paymentProvider?: string;

  paymentAmount?: number;
  paymentCurrency?: string;

  paymentTransactionId?: string;

  paymentCreatedAt?: string;
  reservationExpiresAt?: string;

  paidAt?: string;
  refundedAt?: string;

  /*
    EMAIL
  */

  confirmationEmailSentAt?: string;
  confirmationEmailId?: string;

  emailDeliveryStatus?:
    EmailDeliveryStatus;

  emailBouncedAt?: string;
};

function getString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

export async function POST(
  request: Request
) {
  if (!trustedRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    /*
      AUTH
    */

    const authenticated =
      await isAdminAuthenticated("registrations");

    if (!authenticated) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /*
      BODY
    */

    let body:
      RequestBody;

    try {
      body =
        (await request.json()) as
          RequestBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request.",
        },
        {
          status: 400,
        }
      );
    }

    const action =
      getString(
        body.action
      );

    /*
      ALL EVENTS + STATS
    */

    if (
      action ===
      "overview"
    ) {
      const events = await client.fetch<Array<EventDocument & {
        stats: {
          confirmed: number;
          waitlist: number;
          checkedIn: number;
          cancelled: number;
          pendingPayment: number;
          activePendingPayment: number;
        };
      }>>(
        `*[_type == "event"] | order(date asc) {
          _id, title, "slug": slug.current, date, time, venue, location,
          capacity, price, currency, onlinePaymentsEnabled, registrationStatus,
          "stats": {
            "confirmed": count(*[_type == "eventRegistration" && event._ref == ^._id && status == "confirmed"]),
            "waitlist": count(*[_type == "eventRegistration" && event._ref == ^._id && status == "waitlist"]),
            "checkedIn": count(*[_type == "eventRegistration" && event._ref == ^._id && status == "checked-in"]),
            "cancelled": count(*[_type == "eventRegistration" && event._ref == ^._id && status == "cancelled"]),
            "pendingPayment": count(*[_type == "eventRegistration" && event._ref == ^._id && status == "pending-payment"]),
            "activePendingPayment": count(*[_type == "eventRegistration" && event._ref == ^._id &&
              status == "pending-payment" && dateTime(reservationExpiresAt) > dateTime($now)])
          }
        }`,
        { now: new Date().toISOString() },
        { cache: "no-store" },
      );

      const result = events.map(event => {
        const eventStats = event.stats;

        /*
          Confirmed + checked-in
          attendees are registered.

          Active pending payments
          also reserve capacity.
        */

        const occupied =
          eventStats.confirmed +
          eventStats.checkedIn;

        const capacityUsed =
          occupied +
          eventStats.activePendingPayment;

        const remaining =
          typeof event.capacity ===
            "number" &&
          event.capacity > 0
            ? Math.max(
                event.capacity -
                  capacityUsed,
                0
              )
            : null;

        return {
          ...event,

          stats: {
            ...eventStats,

            occupied,
            capacityUsed,
            remaining,
          },
        };
      });

      return NextResponse.json({
        success: true,
        events: result,
      });
    }

    /*
      ONE EVENT + REGISTRATIONS
    */

    if (
      action ===
      "event"
    ) {
      const eventId =
        getString(
          body.eventId
        );

      if (!eventId) {
        return NextResponse.json(
          {
            error:
              "Missing event ID.",
          },
          {
            status: 400,
          }
        );
      }

      const event =
        await client.fetch<
          EventDocument | null
        >(
          `
            *[
              _type == "event"
              && _id == $eventId
            ][0] {
              _id,

              title,

              "slug":
                slug.current,

              date,
              time,

              venue,
              location,

              capacity,

              price,
              currency,

              onlinePaymentsEnabled,

              registrationStatus
            }
          `,
          {
            eventId,
          }
        );

      if (!event) {
        return NextResponse.json(
          {
            error:
              "Event not found.",
          },
          {
            status: 404,
          }
        );
      }

      const pageSize = 50;
      const page = typeof body.page === "number" && Number.isSafeInteger(body.page)
        ? Math.min(10_000, Math.max(0, body.page)) : 0;
      const search = getString(body.search).toLowerCase().slice(0, 160);
      const status = getString(body.status) || "all";
      const registrations =
        await client.fetch<
          RegistrationDocument[]
        >(
          `
            *[
              _type ==
                "eventRegistration"

              && event._ref ==
                $eventId
              && ($status == "all" || status == $status)
              && ($search == "" || count(string::split(lower(
                coalesce(firstName, "") + " " + coalesce(lastName, "") + " " +
                coalesce(email, "") + " " + coalesce(university, "")
              ), $search)) > 1)
            ]
            | order(
                registeredAt desc, _id desc
              )[${page * pageSize}...${page * pageSize + pageSize + 1}] {
              _id,

              "eventId":
                event._ref,

              firstName,
              lastName,
              email,

              university,
              note,

              status,

              ticketCode,

              registeredAt,
              checkedInAt,

              paymentStatus,
              paymentProvider,

              paymentAmount,
              paymentCurrency,

              paymentTransactionId,

              paymentCreatedAt,
              reservationExpiresAt,

              paidAt,
              refundedAt,

              confirmationEmailSentAt,
              confirmationEmailId,

              emailBouncedAt,

              "emailDeliveryStatus":
                select(
                  defined(
                    emailDeliveryStatus
                  ) =>
                    emailDeliveryStatus,

                  defined(
                    emailBouncedAt
                  ) =>
                    "bounced",

                  defined(
                    confirmationEmailSentAt
                  ) =>
                    "sent",

                  "not-sent"
                )
            }
          `,
          {
            eventId, search, status,
          },
          { cache: "no-store" }
        );

      return NextResponse.json({
        success: true,
        event,
        registrations: registrations.slice(0, pageSize),
        hasNextPage: registrations.length > pageSize,
      });
    }

    /*
      UNKNOWN ACTION
    */

    return NextResponse.json(
      {
        error:
          "Unknown dashboard action.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "Event dashboard API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not load event dashboard.",
      },
      {
        status: 500,
      }
    );
  }
}
