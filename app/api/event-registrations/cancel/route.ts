import {
  NextResponse,
} from "next/server";

import {
  randomUUID,
} from "node:crypto";

import {
  client,
} from "@/sanity/lib/client";

import {
  verifyCancellationToken,
} from "@/lib/events/cancellationToken";

import {
  sendEventRegistrationEmail,
} from "@/lib/email/sendEventRegistrationEmail";

export const runtime =
  "nodejs";

type RegistrationStatus =
  | "confirmed"
  | "waitlist"
  | "cancelled"
  | "checked-in";

type EventInfo = {
  _id: string;

  title?: string;

  date?: string;
  time?: string;

  venue?: string;
  location?: string;
  address?: string;

  capacity?: number;

  registrationStatus?:
    | "coming-soon"
    | "open"
    | "closed"
    | "full";
};

type Registration = {
  _id: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  status?:
    RegistrationStatus;

  ticketCode?: string;

  registeredAt?: string;

  eventId?: string;

  event?: EventInfo;
};

type CancelRequestBody = {
  registrationId?: unknown;
  token?: unknown;
};

const REGISTRATION_FIELDS = `
  _id,

  firstName,
  lastName,
  email,

  status,

  ticketCode,
  registeredAt,

  "eventId": event._ref,

  "event": event->{
    _id,

    title,

    date,
    time,

    venue,
    location,
    address,

    capacity,
    registrationStatus
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

async function getRegistration(
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

function publicRegistration(
  registration:
    Registration
) {
  return {
    firstName:
      registration.firstName,

    lastName:
      registration.lastName,

    status:
      registration.status,

    event: {
      title:
        registration.event
          ?.title,

      date:
        registration.event
          ?.date,

      time:
        registration.event
          ?.time,

      venue:
        registration.event
          ?.venue,

      location:
        registration.event
          ?.location,
    },
  };
}

async function ensureTicketCode(
  registration:
    Registration
) {
  if (
    registration.ticketCode
  ) {
    return registration
      .ticketCode;
  }

  const sanityToken =
    process.env
      .SANITY_API_WRITE_TOKEN;

  if (!sanityToken) {
    throw new Error(
      "Missing SANITY_API_WRITE_TOKEN."
    );
  }

  const ticketCode =
    randomUUID();

  const writeClient =
    client.withConfig({
      token:
        sanityToken,

      useCdn:
        false,
    });

  await writeClient
    .patch(
      registration._id
    )
    .set({
      ticketCode,
    })
    .commit();

  return ticketCode;
}

async function promoteWaitlist(
  eventId: string,
  event: EventInfo
) {
  const sanityToken =
    process.env
      .SANITY_API_WRITE_TOKEN;

  if (!sanityToken) {
    throw new Error(
      "Missing SANITY_API_WRITE_TOKEN."
    );
  }

  /*
    No fixed capacity means
    there is nothing to promote
    based on available spots.
  */

  if (
    typeof event.capacity !==
      "number" ||
    event.capacity <= 0
  ) {
    return [];
  }

  /*
    If registrations have been
    explicitly closed, do not
    automatically promote people.
  */

  if (
    event.registrationStatus ===
    "closed"
  ) {
    return [];
  }

  const occupied =
    await client.fetch<
      number
    >(
      `
        count(
          *[
            _type == "eventRegistration"
            && event._ref == $eventId
            && status in [
              "confirmed",
              "checked-in"
            ]
          ]
        )
      `,
      {
        eventId,
      }
    );

  const availableSpots =
    Math.max(
      event.capacity -
        occupied,
      0
    );

  if (
    availableSpots <= 0
  ) {
    return [];
  }

  /*
    Oldest waitlist registration
    gets priority.
  */

  const candidates =
    await client.fetch<
      Registration[]
    >(
      `
        *[
          _type == "eventRegistration"
          && event._ref == $eventId
          && status == "waitlist"
        ]
        | order(
          registeredAt asc
        )
        [0...$limit] {
          _id,

          firstName,
          lastName,
          email,

          status,

          ticketCode,
          registeredAt,

          "eventId": event._ref
        }
      `,
      {
        eventId,

        limit:
          availableSpots,
      }
    );

  if (
    candidates.length === 0
  ) {
    return [];
  }

  const writeClient =
    client.withConfig({
      token:
        sanityToken,

      useCdn:
        false,
    });

  const promoted:
    Registration[] =
    [];

  for (
    const candidate
    of candidates
  ) {
    try {
      const ticketCode =
        await ensureTicketCode(
          candidate
        );

      await writeClient
        .patch(
          candidate._id
        )
        .set({
          status:
            "confirmed",
        })
        .unset([
          "checkedInAt",
        ])
        .commit();

      const updated = {
        ...candidate,

        status:
          "confirmed" as const,

        ticketCode,

        event,
        eventId,
      };

      promoted.push(
        updated
      );

      /*
        Promotion itself must not
        fail just because email
        delivery fails.
      */

      try {
        if (
          updated.email &&
          updated.firstName &&
          event.title
        ) {
          const emailResult =
            await sendEventRegistrationEmail(
              {
                registrationId:
                  updated._id,

                ticketCode,

                status:
                  "confirmed",

                firstName:
                  updated.firstName,

                email:
                  updated.email,

                eventTitle:
                  event.title,

                date:
                  event.date,

                time:
                  event.time,

                venue:
                  event.venue,

                location:
                  event.location,

                address:
                  event.address,
              }
            );

          if (
            emailResult.sent
          ) {
            const emailPatch:
              Record<
                string,
                string
              > = {
                confirmationEmailSentAt:
                  new Date()
                    .toISOString(),
              };

            if (
              emailResult.emailId
            ) {
              emailPatch.confirmationEmailId =
                emailResult.emailId;
            }

            await writeClient
              .patch(
                updated._id
              )
              .set(
                emailPatch
              )
              .commit();
          }
        }
      } catch (
        emailError
      ) {
        console.error(
          "Promoted attendee email failed:",
          emailError
        );
      }
    } catch (
      promotionError
    ) {
      console.error(
        "Waitlist promotion failed:",
        promotionError
      );
    }
  }

  return promoted;
}

/*
  GET only verifies the link.

  This is intentional:
  email providers sometimes
  automatically open links.

  We do not want that to cancel
  somebody's registration.
*/

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const registrationId =
      getString(
        url.searchParams.get(
          "id"
        )
      );

    const token =
      getString(
        url.searchParams.get(
          "token"
        )
      );

    if (
      !registrationId ||
      !token
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid cancellation link.",
        },
        {
          status: 400,
        }
      );
    }

    const registration =
      await getRegistration(
        registrationId
      );

    if (
      !registration ||
      !registration.ticketCode
    ) {
      return NextResponse.json(
        {
          error:
            "Registration not found.",
        },
        {
          status: 404,
        }
      );
    }

    const valid =
      verifyCancellationToken(
        registration._id,

        registration.ticketCode,

        token
      );

    if (!valid) {
      return NextResponse.json(
        {
          error:
            "This cancellation link is invalid.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      success: true,

      registration:
        publicRegistration(
          registration
        ),
    });
  } catch (error) {
    console.error(
      "Cancellation link verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not verify this cancellation link.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
  POST performs the actual
  cancellation.
*/

export async function POST(
  request: Request
) {
  try {
    const sanityToken =
      process.env
        .SANITY_API_WRITE_TOKEN;

    if (!sanityToken) {
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

    let body:
      CancelRequestBody;

    try {
      body =
        (await request.json()) as
          CancelRequestBody;
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

    const registrationId =
      getString(
        body.registrationId
      );

    const cancellationToken =
      getString(
        body.token
      );

    if (
      !registrationId ||
      !cancellationToken
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid cancellation request.",
        },
        {
          status: 400,
        }
      );
    }

    const registration =
      await getRegistration(
        registrationId
      );

    if (
      !registration ||
      !registration.ticketCode
    ) {
      return NextResponse.json(
        {
          error:
            "Registration not found.",
        },
        {
          status: 404,
        }
      );
    }

    const valid =
      verifyCancellationToken(
        registration._id,

        registration.ticketCode,

        cancellationToken
      );

    if (!valid) {
      return NextResponse.json(
        {
          error:
            "This cancellation link is invalid.",
        },
        {
          status: 403,
        }
      );
    }

    /*
      Already cancelled is not an
      error. This makes the action
      safely repeatable.
    */

    if (
      registration.status ===
      "cancelled"
    ) {
      return NextResponse.json({
        success: true,

        alreadyCancelled:
          true,

        promotedCount:
          0,
      });
    }

    /*
      Somebody already inside
      the event should not be
      able to cancel afterwards.
    */

    if (
      registration.status ===
      "checked-in"
    ) {
      return NextResponse.json(
        {
          error:
            "This registration has already been checked in and can no longer be cancelled.",
        },
        {
          status: 409,
        }
      );
    }

    const previousStatus =
      registration.status;

    const writeClient =
      client.withConfig({
        token:
          sanityToken,

        useCdn:
          false,
      });

    await writeClient
      .patch(
        registration._id
      )
      .set({
        status:
          "cancelled",
      })
      .unset([
        "checkedInAt",
      ])
      .commit();

    /*
      Only a confirmed person
      frees an occupied place.

      Cancelling a waitlist entry
      does not create a new spot.
    */

    let promoted:
      Registration[] =
      [];

    if (
      previousStatus ===
        "confirmed" &&
      registration.eventId &&
      registration.event
    ) {
      promoted =
        await promoteWaitlist(
          registration.eventId,

          registration.event
        );
    }

    return NextResponse.json({
      success: true,

      alreadyCancelled:
        false,

      promotedCount:
        promoted.length,
    });
  } catch (error) {
    console.error(
      "Registration cancellation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not cancel the registration.",
      },
      {
        status: 500,
      }
    );
  }
}