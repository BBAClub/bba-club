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
  sendEventRegistrationEmail,
} from "@/lib/email/sendEventRegistrationEmail";

export const runtime =
  "nodejs";

type RegistrationStatus =
  | "confirmed"
  | "waitlist"
  | "cancelled"
  | "checked-in";

type EventDocument = {
  _id: string;

  title?: string;
  slug?: string;

  date?: string;
  time?: string;

  location?: string;
  venue?: string;
  address?: string;

  capacity?: number;

  registrationStatus?:
    | "coming-soon"
    | "open"
    | "closed"
    | "full";

  registrationDeadline?:
    string;
};

type ExistingRegistration = {
  _id: string;

  status?:
    RegistrationStatus;

  registeredAt?: string;

  ticketCode?: string;

  email?: string;
};

type RegistrationBody = {
  eventSlug?: unknown;

  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;

  university?: unknown;
  note?: unknown;

  /*
    Honeypot field.
  */
  website?: unknown;
};

function getString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function normalizeEmail(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

function validEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function createPrivateRegistrationId() {
  return `private.event-registration-${randomUUID()}`;
}

export async function POST(
  request: Request
) {
  try {
    const writeToken =
      process.env
        .SANITY_API_WRITE_TOKEN;

    if (!writeToken) {
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

    /*
      PARSE REQUEST
    */

    let body:
      RegistrationBody;

    try {
      body =
        (await request.json()) as
          RegistrationBody;
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

    /*
      BOT HONEYPOT
    */

    const website =
      getString(
        body.website
      );

    if (website) {
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

    /*
      INPUT
    */

    const eventSlug =
      getString(
        body.eventSlug
      );

    const firstName =
      getString(
        body.firstName
      );

    const lastName =
      getString(
        body.lastName
      );

    const email =
      normalizeEmail(
        getString(
          body.email
        )
      );

    const university =
      getString(
        body.university
      );

    const note =
      getString(
        body.note
      );

    /*
      VALIDATION
    */

    if (
      !eventSlug ||
      !firstName ||
      !lastName ||
      !email
    ) {
      return NextResponse.json(
        {
          error:
            "Please fill in all required fields.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !validEmail(email)
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      firstName.length > 80 ||
      lastName.length > 80 ||
      email.length > 254 ||
      university.length > 120 ||
      note.length > 1000
    ) {
      return NextResponse.json(
        {
          error:
            "One or more fields are too long.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      LOAD EVENT
    */

    const event =
      await client.fetch<
        EventDocument | null
      >(
        `
          *[
            _type == "event"
            && slug.current == $eventSlug
          ][0] {
            _id,

            title,

            "slug":
              slug.current,

            date,
            time,

            location,
            venue,
            address,

            capacity,

            registrationStatus,
            registrationDeadline
          }
        `,
        {
          eventSlug,
        }
      );

    if (
      !event ||
      !event.title
    ) {
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

    /*
      REGISTRATION STATE
    */

    if (
      !event.registrationStatus
    ) {
      return NextResponse.json(
        {
          error:
            "Registration is not available for this event.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      event.registrationStatus ===
      "coming-soon"
    ) {
      return NextResponse.json(
        {
          error:
            "Registration has not opened yet.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      event.registrationStatus ===
      "closed"
    ) {
      return NextResponse.json(
        {
          error:
            "Registration for this event is closed.",
        },
        {
          status: 409,
        }
      );
    }

    /*
      DEADLINE
    */

    if (
      event.registrationDeadline
    ) {
      const deadline =
        new Date(
          event.registrationDeadline
        );

      if (
        !Number.isNaN(
          deadline.getTime()
        ) &&
        deadline.getTime() <
          Date.now()
      ) {
        return NextResponse.json(
          {
            error:
              "The registration deadline has passed.",
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
      DUPLICATE CHECK

      Because our server has a
      Sanity read token, this query
      sees both old public
      registrations and new private
      registrations.
    */

    const existing =
      await client.fetch<
        ExistingRegistration | null
      >(
        `
          *[
            _type ==
              "eventRegistration"

            && event._ref ==
              $eventId

            && lower(email) ==
              $email
          ]
          | order(
            registeredAt desc
          )
          [0] {
            _id,
            status,
            registeredAt,
            ticketCode,
            email
          }
        `,
        {
          eventId:
            event._id,

          email,
        }
      );

    /*
      Existing active registration.
    */

    if (
      existing &&
      existing.status !==
        "cancelled"
    ) {
      return NextResponse.json(
        {
          error:
            "This email is already registered for the event.",

          code:
            "ALREADY_REGISTERED",

          status:
            existing.status,
        },
        {
          status: 409,
        }
      );
    }

    /*
      COUNT OCCUPIED SPOTS

      Checked-in attendees still
      occupy capacity.
    */

    const occupied =
      await client.fetch<number>(
        `
          count(
            *[
              _type ==
                "eventRegistration"

              && event._ref ==
                $eventId

              && status in [
                "confirmed",
                "checked-in"
              ]
            ]
          )
        `,
        {
          eventId:
            event._id,
        }
      );

    /*
      DETERMINE STATUS
    */

    let status:
      "confirmed"
      | "waitlist" =
      "confirmed";

    if (
      event.registrationStatus ===
      "full"
    ) {
      status =
        "waitlist";
    } else if (
      typeof event.capacity ===
        "number" &&
      event.capacity > 0 &&
      occupied >=
        event.capacity
    ) {
      status =
        "waitlist";
    }

    const registeredAt =
      new Date()
        .toISOString();

    /*
      Generate a NEW ticket when
      somebody registers again
      after cancellation.

      Therefore the previous QR
      becomes invalid.
    */

    const ticketCode =
      randomUUID();

    const writeClient =
      client.withConfig({
        token:
          writeToken,

        useCdn:
          false,
      });

    /*
      DOCUMENT ID

      Any ID containing "." is a
      private Sanity document.

      UUID contains no email,
      name or other personal data.
    */

    let registrationId =
      createPrivateRegistrationId();

    /*
      If an already-private
      registration was cancelled,
      reactivate the same document.

      If the cancelled document is
      one of our OLD public
      registrations, delete it and
      recreate it privately.
    */

    if (
      existing &&
      existing.status ===
        "cancelled"
    ) {
      const existingIsPrivate =
        existing._id.includes(
          "."
        );

      if (
        existingIsPrivate
      ) {
        registrationId =
          existing._id;

        await writeClient
          .patch(
            registrationId
          )
          .set({
            status,

            registeredAt,

            firstName,
            lastName,
            email,

            ticketCode,

            ...(university
              ? {
                  university,
                }
              : {}),

            ...(note
              ? {
                  note,
                }
              : {}),
          })
          .unset([
            "checkedInAt",
            "confirmationEmailSentAt",
            "confirmationEmailId",
          ])
          .commit();
      } else {
        /*
          Old public cancelled
          registration.

          Remove it and replace it
          with a private document.
        */

        await writeClient
          .delete(
            existing._id
          );

        await writeClient.create({
          _id:
            registrationId,

          _type:
            "eventRegistration",

          event: {
            _type:
              "reference",

            _ref:
              event._id,
          },

          status,

          registeredAt,

          firstName,
          lastName,
          email,

          ticketCode,

          ...(university
            ? {
                university,
              }
            : {}),

          ...(note
            ? {
                note,
              }
            : {}),
        });
      }
    } else {
      /*
        Completely new
        registration.
      */

      await writeClient.create({
        _id:
          registrationId,

        _type:
          "eventRegistration",

        event: {
          _type:
            "reference",

          _ref:
            event._id,
        },

        status,

        registeredAt,

        firstName,
        lastName,
        email,

        ticketCode,

        ...(university
          ? {
              university,
            }
          : {}),

        ...(note
          ? {
              note,
            }
          : {}),
      });
    }

    /*
      WAITLIST POSITION
    */

    let waitlistPosition:
      | number
      | undefined;

    if (
      status ===
      "waitlist"
    ) {
      waitlistPosition =
        await client.fetch<number>(
          `
            count(
              *[
                _type ==
                  "eventRegistration"

                && event._ref ==
                  $eventId

                && status ==
                  "waitlist"

                && registeredAt <=
                  $registeredAt
              ]
            )
          `,
          {
            eventId:
              event._id,

            registeredAt,
          }
        );
    }

    /*
      CONFIRMATION EMAIL

      Registration remains valid
      even if email sending fails.
    */

    let emailSent =
      false;

    try {
      const emailResult =
        await sendEventRegistrationEmail(
          {
            registrationId,

            ticketCode,

            status,

            firstName,

            email,

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

            waitlistPosition,
          }
        );

      if (
        emailResult.sent
      ) {
        emailSent =
          true;

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
            registrationId
          )
          .set(
            emailPatch
          )
          .commit();
      }
    } catch (
      emailError
    ) {
      console.error(
        "Registration confirmation email failed:",
        emailError
      );
    }

    /*
      RESPONSE
    */

    return NextResponse.json(
      {
        success:
          true,

        status,

        eventTitle:
          event.title,

        ticketCode:
          status ===
          "confirmed"
            ? ticketCode
            : undefined,

        waitlistPosition,

        emailSent,
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      "Event registration error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not complete the registration.",
      },
      {
        status:
          500,
      }
    );
  }
}