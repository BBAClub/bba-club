import {
  NextResponse,
} from "next/server";

import {
  client,
} from "@/sanity/lib/client";

import {
  verifyCancellationToken,
} from "@/lib/events/cancellationToken";

import {
  cancelComgatePayment,
} from "@/lib/payments/comgate";

import {
  promoteWaitlist,
  type PromotionEvent,
} from "@/lib/events/promoteWaitlist";

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

type Registration = {
  _id: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  status?:
    RegistrationStatus;

  ticketCode?: string;

  registeredAt?: string;

  paymentStatus?:
    PaymentStatus;

  paymentProvider?: string;

  paymentTransactionId?: string;

  reservationExpiresAt?: string;

  eventId?: string;

  event?: PromotionEvent;
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

  paymentStatus,
  paymentProvider,
  paymentTransactionId,
  reservationExpiresAt,

  "eventId": event._ref,

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

/*
  GET only verifies the
  cancellation link.

  Email scanners sometimes open
  links automatically, so GET must
  never change registration state.
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
      success:
        true,

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
      Repeat cancellation safely.
    */

    if (
      registration.status ===
      "cancelled"
    ) {
      return NextResponse.json({
        success:
          true,

        alreadyCancelled:
          true,

        promotedCount:
          0,
      });
    }

    /*
      Checked-in attendees can no
      longer cancel themselves.
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

    /*
      ==================================
      ACTIVE COMGATE PAYMENT
      ==================================

      If a temporarily reserved seat
      is released, cancel the external
      payment BEFORE releasing the
      seat locally.

      Otherwise the attendee could
      still pay using an old checkout
      URL after we had offered the
      place to somebody else.
    */

    if (
      previousStatus ===
        "pending-payment" &&
      registration
        .paymentProvider ===
        "comgate" &&
      registration
        .paymentTransactionId
    ) {
      try {
        const cancellation =
          await cancelComgatePayment(
            registration
              .paymentTransactionId
          );

        /*
          Race condition:

          The attendee may have
          completed payment just
          before pressing Cancel.
        */

        if (
          cancellation.status ===
            "PAID" ||
          cancellation.status ===
            "AUTHORIZED"
        ) {
          return NextResponse.json(
            {
              error:
                "The payment has already been completed or authorized. Your registration cannot be cancelled as an unpaid reservation.",

              code:
                "PAYMENT_ALREADY_COMPLETED",
            },
            {
              status: 409,
            }
          );
        }

        /*
          If Comgate still considers
          the transaction PENDING,
          we do not release the seat.
        */

        if (
          cancellation.status ===
          "PENDING"
        ) {
          return NextResponse.json(
            {
              error:
                "The payment is still being processed. Please try again shortly.",

              code:
                "PAYMENT_STILL_PENDING",
            },
            {
              status: 409,
            }
          );
        }

        if (
          cancellation.status !==
          "CANCELLED"
        ) {
          return NextResponse.json(
            {
              error:
                "The payment could not be safely cancelled.",
            },
            {
              status: 409,
            }
          );
        }
      } catch (error) {
        console.error(
          "Comgate cancellation failed:",
          error
        );

        /*
          Do not release the local
          seat if we cannot establish
          what happened to the
          external payment.
        */

        return NextResponse.json(
          {
            error:
              "We could not cancel the pending payment. Please try again shortly.",
          },
          {
            status: 503,
          }
        );
      }
    }

    const writeClient =
      client.withConfig({
        token:
          sanityToken,

        useCdn:
          false,
      });

    /*
      A confirmed registration or an
      active payment reservation frees
      a capacity slot.

      Cancelling an ordinary waitlist
      entry does not.
    */

    const freedSeat =
      previousStatus ===
        "confirmed" ||
      previousStatus ===
        "pending-payment";

    /*
      Preserve "paid" for already-paid
      tickets.

      Automatic refunds are NOT being
      performed here.

      For cancelled pending payments,
      mark the failed/cancelled payment
      attempt accordingly.
    */

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

    /*
      If a seat was freed, offer it
      to the oldest waitlist entry.

      Free / legacy pay-on-site:
      → confirmed immediately.

      New paid registration:
      → pending-payment + Comgate.
    */

    let promoted =
      [];

    if (
      freedSeat &&
      registration.eventId &&
      registration.event
    ) {
      try {
        promoted =
          await promoteWaitlist({
            eventId:
              registration.eventId,

            event:
              registration.event,

            siteOrigin:
              getSiteOrigin(
                request
              ),
          });
      } catch (error) {
        /*
          Cancellation itself is still
          valid even if automatic
          waitlist promotion fails.
        */

        console.error(
          "Waitlist promotion after cancellation failed:",
          error
        );
      }
    }

    return NextResponse.json({
      success:
        true,

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