import { NextResponse } from "next/server";

import { randomUUID } from "node:crypto";

import { client } from "@/sanity/lib/client";

import {
  sendEventRegistrationEmail,
} from "@/lib/email/sendEventRegistrationEmail";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const runtime = "nodejs";

type RegistrationStatus =
  | "confirmed"
  | "waitlist"
  | "cancelled"
  | "checked-in";

type AdminAction =
  | "confirm"
  | "waitlist"
  | "cancel"
  | "check-in"
  | "undo-check-in";

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

  status?: RegistrationStatus;

  ticketCode?: string;

  registeredAt?: string;

  eventId?: string;

  event?: EventInfo;
};

type RequestBody = {
  registrationId?: unknown;
  action?: unknown;
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

async function patchStatus(
  registrationId: string,
  status: RegistrationStatus
) {
  const token =
    process.env
      .SANITY_API_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      "Missing SANITY_API_WRITE_TOKEN."
    );
  }

  const writeClient =
    client.withConfig({
      token,
      useCdn: false,
    });

  let patch =
    writeClient
      .patch(registrationId)
      .set({
        status,
      });

  if (
    status === "checked-in"
  ) {
    patch =
      patch.set({
        checkedInAt:
          new Date()
            .toISOString(),
      });
  } else {
    patch =
      patch.unset([
        "checkedInAt",
      ]);
  }

  await patch.commit();
}

async function ensureTicketCode(
  registration: Registration
) {
  if (
    registration.ticketCode
  ) {
    return registration
      .ticketCode;
  }

  const token =
    process.env
      .SANITY_API_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      "Missing SANITY_API_WRITE_TOKEN."
    );
  }

  const writeClient =
    client.withConfig({
      token,
      useCdn: false,
    });

  const ticketCode =
    randomUUID();

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

async function getWaitlistPosition(
  registration: Registration
) {
  if (
    !registration.eventId ||
    !registration.registeredAt
  ) {
    return undefined;
  }

  return client.fetch<number>(
    `
      count(
        *[
          _type == "eventRegistration"
          && event._ref == $eventId
          && status == "waitlist"
          && registeredAt <= $registeredAt
        ]
      )
    `,
    {
      eventId:
        registration.eventId,

      registeredAt:
        registration.registeredAt,
    }
  );
}

async function sendStatusEmail(
  registration: Registration,

  status:
    | "confirmed"
    | "waitlist",

  waitlistPosition?: number
) {
  const event =
    registration.event;

  if (
    !registration.email ||
    !registration.firstName ||
    !event?.title
  ) {
    return false;
  }

  const ticketCode =
    await ensureTicketCode(
      registration
    );

  const emailResult =
    await sendEventRegistrationEmail(
      {
        registrationId:
          registration._id,

        ticketCode,

        status,

        firstName:
          registration.firstName,

        email:
          registration.email,

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

  if (!emailResult.sent) {
    return false;
  }

  const token =
    process.env
      .SANITY_API_WRITE_TOKEN;

  if (!token) {
    return true;
  }

  const writeClient =
    client.withConfig({
      token,
      useCdn: false,
    });

  const emailPatch:
    Record<string, string> = {
      confirmationEmailSentAt:
        new Date()
          .toISOString(),
    };

  if (emailResult.emailId) {
    emailPatch.confirmationEmailId =
      emailResult.emailId;
  }

  await writeClient
    .patch(
      registration._id
    )
    .set(emailPatch)
    .commit();

  return true;
}

async function checkCapacity(
  registration: Registration
) {
  const event =
    registration.event;

  const eventId =
    registration.eventId;

  if (
    !event ||
    !eventId
  ) {
    throw new Error(
      "Registration is not connected to an event."
    );
  }

  if (
    typeof event.capacity !==
      "number" ||
    event.capacity <= 0
  ) {
    return;
  }

  const occupied =
    await client.fetch<number>(
      `
        count(
          *[
            _type == "eventRegistration"
            && event._ref == $eventId
            && _id != $registrationId
            && status in [
              "confirmed",
              "checked-in"
            ]
          ]
        )
      `,
      {
        eventId,

        registrationId:
          registration._id,
      }
    );

  if (
    occupied >=
    event.capacity
  ) {
    throw new Error(
      `The event is full (${occupied}/${event.capacity}).`
    );
  }
}

async function promoteWaitlist(
  eventId: string,
  event: EventInfo,
  excludeRegistrationId?: string
) {
  if (
    event.registrationStatus ===
    "closed"
  ) {
    return [];
  }

  if (
    typeof event.capacity !==
      "number" ||
    event.capacity <= 0
  ) {
    return [];
  }

  const occupied =
    await client.fetch<number>(
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

  const freeSpots =
    Math.max(
      event.capacity -
        occupied,
      0
    );

  if (
    freeSpots <= 0
  ) {
    return [];
  }

  const waitlist =
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
        ) {
          ${REGISTRATION_FIELDS}
        }
      `,
      {
        eventId,
      }
    );

  const candidates =
    waitlist
      .filter(
        (candidate) =>
          candidate._id !==
          excludeRegistrationId
      )
      .slice(
        0,
        freeSpots
      );

  const promoted:
    Registration[] = [];

  for (
    const candidate
    of candidates
  ) {
    try {
      await patchStatus(
        candidate._id,
        "confirmed"
      );

      const updated = {
        ...candidate,

        status:
          "confirmed" as const,
      };

      promoted.push(
        updated
      );

      try {
        await sendStatusEmail(
          updated,
          "confirmed"
        );
      } catch (emailError) {
        console.error(
          "Waitlist promotion email failed:",
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

export async function POST(
  request: Request
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

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

    const registrationId =
      getString(
        body.registrationId
      );

    const action =
      getString(
        body.action
      ) as AdminAction;

    if (!registrationId) {
      return NextResponse.json(
        {
          error:
            "Missing registration ID.",
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

    if (!registration) {
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

    const previousStatus =
      registration.status;

    /*
      CONFIRM
    */

    if (action === "confirm") {
      await checkCapacity(
        registration
      );

      await patchStatus(
        registration._id,
        "confirmed"
      );

      const updated = {
        ...registration,

        status:
          "confirmed" as const,
      };

      if (
        previousStatus !==
        "confirmed"
      ) {
        try {
          await sendStatusEmail(
            updated,
            "confirmed"
          );
        } catch (emailError) {
          console.error(
            "Confirmation email failed:",
            emailError
          );
        }
      }

      return NextResponse.json({
        success: true,

        registration:
          updated,

        promoted: [],
      });
    }

    /*
      CHECK IN
    */

    if (
      action === "check-in"
    ) {
      if (
        previousStatus !==
        "confirmed"
      ) {
        return NextResponse.json(
          {
            error:
              "Only confirmed attendees can be checked in.",
          },
          {
            status: 409,
          }
        );
      }

      await patchStatus(
        registration._id,
        "checked-in"
      );

      return NextResponse.json({
        success: true,
        promoted: [],
      });
    }

    /*
      UNDO CHECK-IN
    */

    if (
      action ===
      "undo-check-in"
    ) {
      if (
        previousStatus !==
        "checked-in"
      ) {
        return NextResponse.json(
          {
            error:
              "This attendee is not checked in.",
          },
          {
            status: 409,
          }
        );
      }

      await patchStatus(
        registration._id,
        "confirmed"
      );

      return NextResponse.json({
        success: true,
        promoted: [],
      });
    }

    /*
      MOVE TO WAITLIST
    */

    if (
      action === "waitlist"
    ) {
      const freedSeat =
        previousStatus ===
          "confirmed" ||
        previousStatus ===
          "checked-in";

      await patchStatus(
        registration._id,
        "waitlist"
      );

      const updated = {
        ...registration,

        status:
          "waitlist" as const,
      };

      try {
        const position =
          await getWaitlistPosition(
            updated
          );

        await sendStatusEmail(
          updated,
          "waitlist",
          position
        );
      } catch (emailError) {
        console.error(
          "Waitlist email failed:",
          emailError
        );
      }

      let promoted:
        Registration[] = [];

      if (
        freedSeat &&
        registration.eventId &&
        registration.event
      ) {
        promoted =
          await promoteWaitlist(
            registration.eventId,

            registration.event,

            registration._id
          );
      }

      return NextResponse.json({
        success: true,

        registration:
          updated,

        promoted,
      });
    }

    /*
      CANCEL
    */

    if (action === "cancel") {
      const freedSeat =
        previousStatus ===
          "confirmed" ||
        previousStatus ===
          "checked-in";

      await patchStatus(
        registration._id,
        "cancelled"
      );

      let promoted:
        Registration[] = [];

      if (
        freedSeat &&
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
        promoted,
      });
    }

    return NextResponse.json(
      {
        error:
          "Unknown management action.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "Event registration management error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update registration.",
      },
      {
        status: 500,
      }
    );
  }
}