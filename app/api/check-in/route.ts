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

type Registration = {
  _id: string;
  _rev: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  status?: RegistrationStatus;

  paymentStatus?: PaymentStatus;
  paymentAmount?: number;
  paymentCurrency?: string;

  ticketCode?: string;

  registeredAt?: string;
  checkedInAt?: string;

  event?: {
    _id?: string;
    title?: string;

    date?: string;
    time?: string;

    location?: string;
    venue?: string;
  };
};

type CheckInRequest = {
  action?: unknown;
  eventId?: unknown;

  ticket?: unknown;

  registrationId?: unknown;

  paymentCollected?: unknown;

  query?: unknown;
};

const REGISTRATION_FIELDS = `
  _id,
  _rev,

  firstName,
  lastName,
  email,

  status,

  paymentStatus,
  paymentAmount,
  paymentCurrency,

  ticketCode,

  registeredAt,
  checkedInAt,

  "event": event->{
    _id,
    title,
    date,
    time,
    location,
    venue
  }
`;

function getString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function normalizeTicket(
  value: string
) {
  const trimmed =
    value.trim();

  if (
    trimmed.startsWith(
      "bba-ticket:"
    )
  ) {
    return trimmed
      .slice(
        "bba-ticket:".length
      )
      .trim();
  }

  return trimmed;
}

async function findRegistrationByTicket(
  ticketCode: string,
  eventId: string
) {
  return client.fetch<
    Registration | null
  >(
    `
      *[
        _type == "eventRegistration"
        && event._ref == $eventId
        && ticketCode == $ticketCode
      ][0] {
        ${REGISTRATION_FIELDS}
      }
    `,
    {
      ticketCode,
      eventId,
    }
  );
}

async function findRegistrationById(
  registrationId: string,
  eventId: string
) {
  return client.fetch<
    Registration | null
  >(
    `
      *[
        _type == "eventRegistration"
        && event._ref == $eventId
        && _id == $registrationId
      ][0] {
        ${REGISTRATION_FIELDS}
      }
    `,
    {
      registrationId,
      eventId,
    }
  );
}

export async function POST(
  request: Request
) {
  if (!trustedRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const authenticated =
      await isAdminAuthenticated("checkin");

    if (!authenticated) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      process.env
        .SANITY_API_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Server configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    let body: CheckInRequest;

    try {
      body =
        (await request.json()) as
          CheckInRequest;
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

    const eventId = getString(body.eventId);
    if (!eventId) {
      return NextResponse.json({ error: "Select an event first." }, { status: 400 });
    }

    const action =
      getString(body.action);

    /*
      SEARCH
    */

    if (action === "search") {
      const searchQuery =
        getString(body.query)
          .toLowerCase();

      if (
        searchQuery.length < 2
      ) {
        return NextResponse.json(
          {
            error:
              "Enter at least 2 characters.",
          },
          {
            status: 400,
          }
        );
      }

      const pattern =
        `*${searchQuery}*`;

      const results =
        await client.fetch<
          Registration[]
        >(
          `
            *[
              _type == "eventRegistration"
              && event._ref == $eventId
              && (
                lower(firstName) match $pattern
                || lower(lastName) match $pattern
                || lower(email) match $pattern
                || lower(
                  firstName
                  + " "
                  + lastName
                ) match $pattern
              )
            ]
            | order(registeredAt desc)
            [0...10] {
              ${REGISTRATION_FIELDS}
            }
          `,
          {
            pattern,
            eventId,
          }
        );

      return NextResponse.json({
        success: true,
        results,
      });
    }

    /*
      CHECK IN
    */

    if (
      action !== "check-in"
    ) {
      return NextResponse.json(
        {
          error:
            "Unknown action.",
        },
        {
          status: 400,
        }
      );
    }

    const rawTicket =
      getString(body.ticket);

    const registrationId =
      getString(
        body.registrationId
      );

    let registration:
      Registration | null =
      null;

    if (rawTicket) {
      const ticketCode =
        normalizeTicket(
          rawTicket
        );

      registration =
        await findRegistrationByTicket(
          ticketCode, eventId
        );
    } else if (
      registrationId
    ) {
      registration =
        await findRegistrationById(
          registrationId, eventId
        );
    }

    if (!registration) {
      return NextResponse.json(
        {
          error:
            "Ticket not found.",

          code:
            "INVALID_TICKET",
        },
        {
          status: 404,
        }
      );
    }

    if (
      registration.status ===
      "checked-in"
    ) {
      return NextResponse.json({
        success: true,

        alreadyCheckedIn:
          true,

        registration,
      });
    }

    if (
      registration.status ===
      "waitlist"
    ) {
      return NextResponse.json(
        {
          error:
            "This attendee is still on the waitlist.",

          code:
            "WAITLIST",

          registration,
        },
        {
          status: 409,
        }
      );
    }

    if (
      registration.status ===
      "cancelled"
    ) {
      return NextResponse.json(
        {
          error:
            "This registration has been cancelled.",

          code:
            "CANCELLED",

          registration,
        },
        {
          status: 409,
        }
      );
    }

    if (
      registration.status !==
      "confirmed"
    ) {
      return NextResponse.json(
        {
          error:
            "This registration cannot be checked in.",

          code:
            "INVALID_STATUS",

          registration,
        },
        {
          status: 409,
        }
      );
    }

    const paymentCollected =
      body.paymentCollected ===
      true;

    if (
      registration.paymentStatus ===
        "pay_on_site" &&
      !paymentCollected
    ) {
      return NextResponse.json(
        {
          error:
            "Payment must be collected at the venue.",

          code:
            "PAY_ON_SITE",

          registration,
        },
        {
          status: 409,
        }
      );
    }

    const writeClient =
      client.withConfig({
        token,
        useCdn: false,
      });

    const checkedInAt =
      new Date().toISOString();

    await writeClient
      .patch(
        registration._id
      )
      .ifRevisionId(registration._rev)
      .set({
        status: "checked-in",
        checkedInAt,
        ...(registration.paymentStatus === "pay_on_site" &&
        paymentCollected
          ? {
              paymentStatus: "paid",
              paymentProvider: "manual",
              paidAt: checkedInAt,
            }
          : {}),
      })
      .commit();

    return NextResponse.json({
      success: true,

      alreadyCheckedIn:
        false,

      registration: {
        ...registration,

        status:
          "checked-in" as const,

        checkedInAt,

        ...(registration.paymentStatus === "pay_on_site" &&
        paymentCollected
          ? {
              paymentStatus: "paid" as const,
            }
          : {}),
      },
    });
  } catch (error) {
    if ((error as { statusCode?: number })?.statusCode === 409) {
      return NextResponse.json(
        { error: "Registration changed. Refresh and try again." },
        { status: 409 }
      );
    }

    console.error(
      "Check-in API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong during check-in.",
      },
      {
        status: 500,
      }
    );
  }
}