import { trustedRequest } from "@/lib/admin/security";
import { capacityConflict, capacityTransaction, readEventCapacity } from "@/lib/events/capacity";
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

import {
  cancelComgatePayment,
} from "@/lib/payments/comgate";

import {
  promoteWaitlist,
  type PromotedRegistration,
  type PromotionEvent,
} from "@/lib/events/promoteWaitlist";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const runtime =
  "nodejs";

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

type AdminAction =
  | "confirm"
  | "waitlist"
  | "cancel"
  | "check-in"
  | "undo-check-in";

type Registration = {
  _id: string;
  _rev: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  status?: RegistrationStatus;

  ticketCode?: string;

  registeredAt?: string;

  paymentStatus?: PaymentStatus;

  paymentProvider?: string;

  paymentTransactionId?: string;

  paymentRedirectUrl?: string;

  paymentAmount?: number;

  paymentCurrency?: string;

  reservationExpiresAt?: string;

  eventId?: string;

  event?: PromotionEvent;
};

type RequestBody = {
  registrationId?: unknown;

  action?: unknown;
};

const REGISTRATION_FIELDS = `
  _id,
  _rev,

  firstName,
  lastName,
  email,

  status,

  ticketCode,
  registeredAt,

  paymentStatus,
  paymentProvider,

  paymentTransactionId,
  paymentRedirectUrl,

  paymentAmount,
  paymentCurrency,

  reservationExpiresAt,

  "eventId":
    event._ref,

  "event": event->{
    _id,

    title,

    "slug":
      slug.current,

    date,
    time,

    venue,
    location,
    address,

    capacity,
    price,

    currency,
    onlinePaymentsEnabled,


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

function paymentsEnabled() {
  return (
    process.env
      .COMGATE_PAYMENTS_ENABLED ===
    "true"
  );
}

function getSiteOrigin(
  request: Request
) {
  const configured =
    process.env
      .NEXT_PUBLIC_SITE_URL
      ?.trim()
      .replace(
        /\/+$/,
        ""
      );

  if (configured) {
    return configured;
  }

  return new URL(
    request.url
  ).origin;
}

function getEventPrice(
  event?: PromotionEvent
) {
  if (
    typeof event?.price !==
      "number" ||
    !Number.isFinite(
      event.price
    ) ||
    event.price <= 0
  ) {
    return 0;
  }

  return event.price;
}

function getEventCurrency(
  event?: PromotionEvent
) {
  return event?.currency === "EUR"
    ? "EUR" as const
    : "CZK" as const;
}

function eventUsesOnlinePayments(
  event?: PromotionEvent
) {
  return (
    paymentsEnabled() &&
    event?.onlinePaymentsEnabled ===
      true &&
    getEventPrice(event) > 0
  );
}

function paymentSatisfied(
  registration: Registration
) {
  return (
    registration
      .paymentStatus ===
      "paid" ||
    registration
      .paymentStatus ===
      "pay_on_site" ||
    registration
      .paymentProvider ===
      "manual"
  );
}

async function getRegistration(
  registrationId: string
) {
  return client.fetch<
    Registration | null
  >(
    `
      *[
        _type ==
          "eventRegistration"

        && _id ==
          $registrationId
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
  writeClient: typeof client,
  registration: Registration,
  status: RegistrationStatus,
) {
  const patch = writeClient.patch(registration._id).ifRevisionId(registration._rev);
  patch.set({ status });
  if (status === "checked-in") {
    patch.set({ checkedInAt: new Date().toISOString() });
  } else {
    patch.unset(["checkedInAt"]);
  }
  if (status === "waitlist" && registration.status === "pending-payment") {
    patch.set({ paymentStatus: "failed" }).unset(["reservationExpiresAt", "paymentRedirectUrl"]);
  }
  await patch.commit({ visibility: "sync" });
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

      useCdn:
        false,
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
  registration:
    Registration
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
        registration.eventId,

      registeredAt:
        registration.registeredAt,
    }
  );
}

async function sendStatusEmail(
  registration:
    Registration,

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

      useCdn:
        false,
    });

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
      registration._id
    )
    .set(
      emailPatch
    )
    .commit();

  return true;
}

/*
  Capacity includes:

  - confirmed
  - checked-in
  - active Comgate reservation
*/

async function cancelPendingPayment(
  registration:
    Registration
) {
  if (
    registration.status !==
      "pending-payment" ||
    registration
      .paymentProvider !==
      "comgate" ||
    !registration
      .paymentTransactionId
  ) {
    return;
  }

  const cancellation =
    await cancelComgatePayment(
      registration
        .paymentTransactionId
    );

  if (
    cancellation.status ===
      "PAID" ||
    cancellation.status ===
      "AUTHORIZED"
  ) {
    throw new Error(
      "The payment has already been completed or authorized. Wait for the payment status to finish processing before changing this registration."
    );
  }

  if (
    cancellation.status ===
    "PENDING"
  ) {
    throw new Error(
      "The payment is still pending and the seat cannot be released safely."
    );
  }

  if (
    cancellation.status !==
    "CANCELLED"
  ) {
    throw new Error(
      "The payment could not be safely cancelled."
    );
  }
}

async function promoteAfterSeatFreed(
  request: Request,

  registration:
    Registration,

  excludeRegistrationId?:
    string
) {
  if (
    !registration.eventId ||
    !registration.event
  ) {
    return [];
  }

  try {
    return await promoteWaitlist({
      eventId:
        registration.eventId,

      event:
        registration.event,

      siteOrigin:
        getSiteOrigin(
          request
        ),

      excludeRegistrationId,
    });
  } catch (error) {
    /*
      The admin operation itself
      should remain valid even if
      automatic promotion fails.
    */

    console.error(
      "Waitlist promotion failed:",
      error
    );

    return [];
  }
}

export async function POST(
  request: Request
) {
  if (!trustedRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  try {
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

    const allowedActions:
      AdminAction[] = [
        "confirm",
        "waitlist",
        "cancel",
        "check-in",
        "undo-check-in",
      ];

    if (
      !allowedActions.includes(
        action
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Unknown management action.",
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

    const eventPrice =
      getEventPrice(
        registration.event
      );

    const writeClient =
      client.withConfig({
        token:
          sanityToken,

        useCdn:
          false,
      });

    /*
      ==================================
      CONFIRM
      ==================================
    */

    if (
      action ===
      "confirm"
    ) {
      /*
        Once online payments are live,
        an admin must not accidentally
        bypass payment for a paid event.

        Paid and explicit pay-on-site
        registrations remain valid.
      */

      if (
        eventPrice > 0 &&
      eventUsesOnlinePayments(
        registration.event
      ) &&
        !paymentSatisfied(
          registration
        )
      ) {
        return NextResponse.json(
          {
            error:
              "This is a paid event and the registration has not been paid. Complete the payment or mark it as pay-on-site before confirming.",
          },
          {
            status: 409,
          }
        );
      }

      if (previousStatus === "confirmed" || previousStatus === "checked-in") {
        return NextResponse.json({ success: true, promoted: [] });
      }

      const eventId = registration.eventId;
      const capacity = eventId && await readEventCapacity(writeClient, eventId, undefined, registration._id);
      if (!eventId || !capacity) {
        return NextResponse.json({ error: "Event not found." }, { status: 409 });
      }
      if (capacity.registrationStatus === "full" ||
          (capacity.capacity && capacity.occupied >= capacity.capacity)) {
        return NextResponse.json({ error: "The event is full." }, { status: 409 });
      }

      const payAtVenue = eventPrice > 0 && !eventUsesOnlinePayments(registration.event) &&
        registration.paymentStatus !== "paid";
      await capacityTransaction(writeClient, eventId, capacity._rev)
        .patch(registration._id, patch => patch.ifRevisionId(registration._rev)
          .set({
            status: "confirmed",
            ...(payAtVenue ? {
              paymentStatus: "pay_on_site",
              paymentProvider: "manual",
              paymentAmount: eventPrice,
              paymentCurrency: getEventCurrency(registration.event),
            } : {}),
          })
          .unset(["checkedInAt", "reservationExpiresAt", "paymentRedirectUrl"]))
        .commit({ visibility: "sync" });

      const updated:
        Registration = {
          ...registration,

          status:
            "confirmed",

          ...(
            eventPrice > 0 &&
      !eventUsesOnlinePayments(
        registration.event
      ) &&
            registration
              .paymentStatus !==
              "paid"
              ? {
                  paymentStatus:
                    "pay_on_site",

                  paymentProvider:
                    "manual",
                }
              : {}
          ),
      };

      try {
        await sendStatusEmail(
          updated,

          "confirmed"
        );
      } catch (error) {
        console.error(
          "Confirmation email failed:",
          error
        );
      }

      return NextResponse.json({
        success:
          true,

        registration:
          updated,

        promoted:
          [],
      });
    }

    /*
      ==================================
      CHECK IN
      ==================================
    */

    if (
      action ===
      "check-in"
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

      /*
        Once online payments are live,
        also guard the door against an
        accidentally confirmed but
        unpaid paid registration.
      */

      if (
        eventPrice > 0 &&
      eventUsesOnlinePayments(
        registration.event
      ) &&
        !paymentSatisfied(
          registration
        )
      ) {
        return NextResponse.json(
          {
            error:
              "This attendee has not completed payment.",
          },
          {
            status: 409,
          }
        );
      }

      if (registration.paymentStatus === "pay_on_site") {
        return NextResponse.json(
          { error: "Use Event check-in to collect and record payment at the venue." },
          { status: 409 },
        );
      }

      await patchStatus(
        writeClient, registration,
        "checked-in"
      );

      return NextResponse.json({
        success:
          true,

        promoted:
          [],
      });
    }

    /*
      ==================================
      UNDO CHECK-IN
      ==================================
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
        writeClient, registration,
        "confirmed"
      );

      return NextResponse.json({
        success:
          true,

        promoted:
          [],
      });
    }

    /*
      ==================================
      MOVE TO WAITLIST
      ==================================
    */

    if (
      action ===
      "waitlist"
    ) {
      const freedSeat =
        previousStatus ===
          "confirmed" ||
        previousStatus ===
          "checked-in" ||
        previousStatus ===
          "pending-payment";

      /*
        Cancel active Comgate checkout
        before releasing a temporary
        reservation.
      */

      if (
        previousStatus ===
        "pending-payment"
      ) {
        await cancelPendingPayment(
          registration
        );

      }

      await patchStatus(
        writeClient, registration,
        "waitlist"
      );

      const updated:
        Registration = {
          ...registration,

          status:
            "waitlist",

          ...(
            previousStatus ===
            "pending-payment"
              ? {
                  paymentStatus:
                    "failed" as const,
                }
              : {}
          ),
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
      } catch (error) {
        console.error(
          "Waitlist email failed:",
          error
        );
      }

      let promoted:
        PromotedRegistration[] =
        [];

      if (
        freedSeat
      ) {
        promoted =
          await promoteAfterSeatFreed(
            request,

            registration,

            registration._id
          );
      }

      return NextResponse.json({
        success:
          true,

        registration:
          updated,

        promoted,
      });
    }

    /*
      ==================================
      CANCEL
      ==================================
    */

    if (
      action ===
      "cancel"
    ) {
      /*
        Repeating cancellation is safe.
      */

      if (
        previousStatus ===
        "cancelled"
      ) {
        return NextResponse.json({
          success:
            true,

          promoted:
            [],
        });
      }

      const freedSeat =
        previousStatus ===
          "confirmed" ||
        previousStatus ===
          "checked-in" ||
        previousStatus ===
          "pending-payment";

      /*
        A pending external payment
        must be cancelled before the
        capacity slot is released.
      */

      if (
        previousStatus ===
        "pending-payment"
      ) {
        await cancelPendingPayment(
          registration
        );
      }

      const paymentWasPending =
        previousStatus ===
          "pending-payment" &&
        registration
          .paymentStatus ===
          "pending";

      let patch =
        writeClient
          .patch(
            registration._id
          )
          .ifRevisionId(registration._rev)
          .set({
            status:
              "cancelled",

            ...(paymentWasPending
              ? {
                  paymentStatus:
                    "failed",
                }
              : {}),
          })
          .unset([
            "checkedInAt",
            "reservationExpiresAt",
          ]);

      if (
        paymentWasPending
      ) {
        patch =
          patch.unset([
            "paymentRedirectUrl",
          ]);
      }

      await patch.commit();

      let promoted:
        PromotedRegistration[] =
        [];

      if (
        freedSeat
      ) {
        promoted =
          await promoteAfterSeatFreed(
            request,

            registration
          );
      }

      /*
        Paid cancellation does NOT
        automatically refund money.

        We return this information so
        the admin UI can later show a
        refund warning/action.
      */

      const refundRequired =
        registration
          .paymentStatus ===
        "paid";

      return NextResponse.json({
        success:
          true,

        promoted,

        refundRequired,
      });
    }

    /*
      Defensive fallback.
    */

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
    if (capacityConflict(error)) {
      return NextResponse.json({ error: "Registration changed. Please try again." }, { status: 409 });
    }
    console.error(
      "Event registration management error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Could not update registration.",
      },
      {
        status: 500,
      }
    );
  }
}