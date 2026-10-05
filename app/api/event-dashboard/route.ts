import { NextResponse } from "next/server";

import { client } from "@/sanity/lib/client";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export const runtime = "nodejs";

type RegistrationStatus =
  | "confirmed"
  | "waitlist"
  | "cancelled"
  | "checked-in";

type RequestBody = {
  action?: unknown;
  eventId?: unknown;
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

  status?: RegistrationStatus;

  registeredAt?: string;
  checkedInAt?: string;
};

function getString(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
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
        },
        {
          status: 401,
        }
      );
    }

    let body: RequestBody;

    try {
      body =
        (await request.json()) as RequestBody;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request.",
        },
        {
          status: 400,
        }
      );
    }

    const action =
      getString(body.action);

    /*
      ALL EVENTS + STATS
    */

    if (action === "overview") {
      const events =
        await client.fetch<
          EventDocument[]
        >(
          `
            *[
              _type == "event"
            ]
            | order(date asc) {
              _id,
              title,
              "slug": slug.current,
              date,
              time,
              venue,
              location,
              capacity,
              registrationStatus
            }
          `
        );

      const registrations =
        await client.fetch<
          Pick<
            RegistrationDocument,
            "_id" | "eventId" | "status"
          >[]
        >(
          `
            *[
              _type == "eventRegistration"
            ] {
              _id,
              "eventId": event._ref,
              status
            }
          `
        );

      const stats =
        new Map<
          string,
          {
            confirmed: number;
            waitlist: number;
            checkedIn: number;
            cancelled: number;
          }
        >();

      for (const event of events) {
        stats.set(event._id, {
          confirmed: 0,
          waitlist: 0,
          checkedIn: 0,
          cancelled: 0,
        });
      }

      for (
        const registration
        of registrations
      ) {
        if (!registration.eventId) {
          continue;
        }

        const current =
          stats.get(
            registration.eventId
          );

        if (!current) {
          continue;
        }

        switch (
          registration.status
        ) {
          case "confirmed":
            current.confirmed += 1;
            break;

          case "waitlist":
            current.waitlist += 1;
            break;

          case "checked-in":
            current.checkedIn += 1;
            break;

          case "cancelled":
            current.cancelled += 1;
            break;
        }
      }

      const result =
        events.map((event) => {
          const eventStats =
            stats.get(event._id) ?? {
              confirmed: 0,
              waitlist: 0,
              checkedIn: 0,
              cancelled: 0,
            };

          const occupied =
            eventStats.confirmed +
            eventStats.checkedIn;

          const remaining =
            typeof event.capacity ===
              "number" &&
            event.capacity > 0
              ? Math.max(
                  event.capacity -
                    occupied,
                  0
                )
              : null;

          return {
            ...event,

            stats: {
              ...eventStats,
              occupied,
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

    if (action === "event") {
      const eventId =
        getString(body.eventId);

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
              "slug": slug.current,
              date,
              time,
              venue,
              location,
              capacity,
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

      const registrations =
        await client.fetch<
          RegistrationDocument[]
        >(
          `
            *[
              _type == "eventRegistration"
              && event._ref == $eventId
            ]
            | order(registeredAt desc) {
              _id,
              "eventId": event._ref,
              firstName,
              lastName,
              email,
              university,
              status,
              registeredAt,
              checkedInAt
            }
          `,
          {
            eventId,
          }
        );

      return NextResponse.json({
        success: true,
        event,
        registrations,
      });
    }

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