import { NextResponse } from "next/server";

import { client } from "@/sanity/lib/client";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export const runtime = "nodejs";

type RegistrationStatus =
  | "confirmed"
  | "waitlist"
  | "cancelled"
  | "checked-in";

type Registration = {
  _id: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  status?: RegistrationStatus;

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

  ticket?: unknown;

  registrationId?: unknown;

  query?: unknown;
};

const REGISTRATION_FIELDS = `
  _id,

  firstName,
  lastName,
  email,

  status,

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
  ticketCode: string
) {
  return client.fetch<
    Registration | null
  >(
    `
      *[
        _type == "eventRegistration"
        && ticketCode == $ticketCode
      ][0] {
        ${REGISTRATION_FIELDS}
      }
    `,
    {
      ticketCode,
    }
  );
}

async function findRegistrationById(
  registrationId: string
) {
  return client.fetch<
    Registration | null
  >(
    `
      *[
        _type == "eventRegistration"
        && _id == $registrationId
      ][0] {
        ${REGISTRATION_FIELDS}
      }
    `,
    {
      registrationId,
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

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
          ticketCode
        );
    } else if (
      registrationId
    ) {
      registration =
        await findRegistrationById(
          registrationId
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
      .set({
        status: "checked-in",
        checkedInAt,
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
      },
    });
  } catch (error) {
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