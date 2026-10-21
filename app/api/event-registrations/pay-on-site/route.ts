import {
  randomUUID,
} from "node:crypto";

import {
  NextResponse,
} from "next/server";

import {
  client,
} from "@/sanity/lib/client";

import {
  verifyPayOnSiteToken,
} from "@/lib/events/payOnSiteToken";

import {
  cancelComgatePayment,
  getComgatePaymentStatus,
} from "@/lib/payments/comgate";

import {
  sendEventRegistrationEmail,
} from "@/lib/email/sendEventRegistrationEmail";

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

type PaymentCurrency =
  | "CZK"
  | "EUR";

type Event = {
  _id: string;

  title?: string;
  slug?: string;

  date?: string;
  time?: string;

  venue?: string;
  location?: string;
  address?: string;

  capacity?: number;
  price?: number;

  currency?:
    PaymentCurrency;

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

  paymentStatus?:
    PaymentStatus;

  paymentProvider?: string;

  paymentTransactionId?: string;

  paymentAmount?: number;

  paymentCurrency?:
    PaymentCurrency;

  reservationExpiresAt?: string;

  eventId?: string;

  event?: Event;
};

type PayOnSiteRequestBody = {
  registrationId?: unknown;

  paymentTransactionId?:
    unknown;

  expiresAt?: unknown;

  token?: unknown;
};

const REGISTRATION_FIELDS = `
  _id,

  firstName,
  lastName,
  email,

  status,
  ticketCode,

  paymentStatus,
  paymentProvider,
  paymentTransactionId,
  paymentAmount,
  paymentCurrency,
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
    currency,

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

    paymentStatus:
      registration.paymentStatus,

    paymentAmount:
      registration.paymentAmount,

    paymentCurrency:
      registration.paymentCurrency,

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

      address:
        registration.event
          ?.address,
    },
  };
}

function verifyRequest(
  registration:
    Registration,

  paymentTransactionId:
    string,

  expiresAt:
    string,

  token:
    string
) {
  if (
    !registration
      .paymentTransactionId ||
    registration
      .paymentTransactionId !==
      paymentTransactionId
  ) {
    return false;
  }

  return verifyPayOnSiteToken(
    registration._id,

    paymentTransactionId,

    expiresAt,

    token
  );
}

/*
  GET only verifies and displays
  the fallback registration.

  It MUST NOT modify anything.
  Email security scanners may open
  this URL automatically.
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

    const paymentTransactionId =
      getString(
        url.searchParams.get(
          "transaction"
        )
      );

    const expiresAt =
      getString(
        url.searchParams.get(
          "expires"
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
      !paymentTransactionId ||
      !expiresAt ||
      !token
    ) {
      return NextResponse.json(
        {
          error:
            "This payment fallback link is incomplete.",
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

    const valid =
      verifyRequest(
        registration,

        paymentTransactionId,

        expiresAt,

        token
      );

    if (!valid) {
      return NextResponse.json(
        {
          error:
            "This payment fallback link is invalid or has expired.",
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
      "Pay-on-site link verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not verify this payment fallback link.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
  POST performs the actual switch
  to pay-on-site.

  Before confirming the seat we:
  1. verify the signed link
  2. verify/cancel the old Comgate payment
  3. check capacity again
  4. issue a new ticket
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
      PayOnSiteRequestBody;

    try {
      body =
        (await request.json()) as
          PayOnSiteRequestBody;
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

    const paymentTransactionId =
      getString(
        body.paymentTransactionId
      );

    const expiresAt =
      getString(
        body.expiresAt
      );

    const token =
      getString(
        body.token
      );

    if (
      !registrationId ||
      !paymentTransactionId ||
      !expiresAt ||
      !token
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payment fallback request.",
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

    const valid =
      verifyRequest(
        registration,

        paymentTransactionId,

        expiresAt,

        token
      );

    if (!valid) {
      return NextResponse.json(
        {
          error:
            "This payment fallback link is invalid or has expired.",
        },
        {
          status: 403,
        }
      );
    }

    /*
      Repeating the request after a
      successful confirmation is safe.
    */

    if (
      registration.status ===
        "confirmed" &&
      registration
        .paymentStatus ===
        "pay_on_site"
    ) {
      return NextResponse.json({
        success:
          true,

        alreadyConfirmed:
          true,

        registration:
          publicRegistration(
            registration
          ),
      });
    }

    /*
      Never convert a payment that has
      already successfully completed.
    */

    if (
      registration
        .paymentStatus ===
        "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "This payment has already been completed online.",

          code:
            "PAYMENT_ALREADY_COMPLETED",
        },
        {
          status: 409,
        }
      );
    }

    if (
      registration
        .paymentStatus ===
        "refunded"
    ) {
      return NextResponse.json(
        {
          error:
            "This payment has already been refunded.",

          code:
            "PAYMENT_REFUNDED",
        },
        {
          status: 409,
        }
      );
    }

    if (
      registration.status ===
        "checked-in"
    ) {
      return NextResponse.json(
        {
          error:
            "This registration has already been checked in.",
        },
        {
          status: 409,
        }
      );
    }

    const event =
      registration.event;

    if (
      !event ||
      !registration.eventId ||
      !event.title
    ) {
      return NextResponse.json(
        {
          error:
            "Event information is incomplete.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !registration.email ||
      !registration.firstName
    ) {
      return NextResponse.json(
        {
          error:
            "Registration information is incomplete.",
        },
        {
          status: 409,
        }
      );
    }

    /*
      Verify the authoritative
      Comgate state.

      A failed-email link must never
      turn a paid transaction into an
      on-site payment.
    */

    try {
      const payment =
        await getComgatePaymentStatus(
          paymentTransactionId
        );

      if (
        payment.status ===
          "PAID" ||
        payment.status ===
          "AUTHORIZED"
      ) {
        return NextResponse.json(
          {
            error:
              "The online payment has already been completed or authorized.",

            code:
              "PAYMENT_ALREADY_COMPLETED",
          },
          {
            status: 409,
          }
        );
      }

      if (
        payment.status ===
        "PENDING"
      ) {
        const cancellation =
          await cancelComgatePayment(
            paymentTransactionId
          );

        if (
          cancellation.status ===
            "PAID" ||
          cancellation.status ===
            "AUTHORIZED"
        ) {
          return NextResponse.json(
            {
              error:
                "The online payment has already been completed or authorized.",

              code:
                "PAYMENT_ALREADY_COMPLETED",
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
                "The previous online payment is still being processed. Please try again shortly.",

              code:
                "PAYMENT_STILL_PENDING",
            },
            {
              status: 409,
            }
          );
        }
      }
    } catch (error) {
      console.error(
        "Pay-on-site Comgate verification failed:",
        error
      );

      return NextResponse.json(
        {
          error:
            "We could not safely verify the previous online payment. Please try again shortly.",
        },
        {
          status: 503,
        }
      );
    }

    /*
      Check capacity again.

      The cancelled/failed
      registration itself does not
      count as occupied.
    */

    const nowIso =
      new Date()
        .toISOString();

    const occupied =
      await client.fetch<number>(
        `
          count(
            *[
              _type ==
                "eventRegistration"

              && event._ref ==
                $eventId

              && (
                status in [
                  "confirmed",
                  "checked-in"
                ]

                ||

                (
                  status ==
                    "pending-payment"

                  && paymentStatus ==
                    "pending"

                  && defined(
                    reservationExpiresAt
                  )

                  && reservationExpiresAt >
                    $now
                )
              )
            ]
          )
        `,
        {
          eventId:
            registration.eventId,

          now:
            nowIso,
        }
      );

    const eventIsFull =
      event.registrationStatus ===
        "full" ||
      (
        typeof event.capacity ===
          "number" &&
        event.capacity > 0 &&
        occupied >=
          event.capacity
      );

    if (eventIsFull) {
      return NextResponse.json(
        {
          error:
            "The event is currently full. Your place can no longer be confirmed for payment at the venue.",

          code:
            "EVENT_FULL",
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

          code:
            "REGISTRATION_CLOSED",
        },
        {
          status: 409,
        }
      );
    }

    const writeClient =
      client.withConfig({
        token:
          sanityToken,

        useCdn:
          false,
      });

    const ticketCode =
      randomUUID();

    const amount =
      registration
        .paymentAmount ??
      event.price ??
      0;

    const currency:
      PaymentCurrency =
        registration
          .paymentCurrency ??
        event.currency ??
        "CZK";

    /*
      Confirm as pay-on-site.

      Keep paymentTransactionId for
      audit history, but the old
      Comgate payment has already
      been verified as CANCELLED.
    */

    await writeClient
      .patch(
        registration._id
      )
      .set({
        status:
          "confirmed",

        ticketCode,

        paymentStatus:
          "pay_on_site",

        paymentProvider:
          "manual",

        paymentAmount:
          amount,

        paymentCurrency:
          currency,

        payOnSiteConfirmedAt:
          nowIso,
      })
      .unset([
        "checkedInAt",

        "reservationExpiresAt",
        "paymentRedirectUrl",

        "paidAt",
        "refundedAt",

        "confirmationEmailSentAt",
        "confirmationEmailId",
      ])
      .commit();

    /*
      Send the normal confirmation
      email with the newly issued QR.
    */

    let emailSent =
      false;

    try {
      const emailResult =
        await sendEventRegistrationEmail(
          {
            registrationId:
              registration._id,

            ticketCode,

            status:
              "confirmed",

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
            registration._id
          )
          .set(
            emailPatch
          )
          .commit();
      }
    } catch (emailError) {
      console.error(
        "Pay-on-site confirmation email failed:",
        emailError
      );
    }

    const updated:
      Registration = {
        ...registration,

        status:
          "confirmed",

        ticketCode,

        paymentStatus:
          "pay_on_site",

        paymentProvider:
          "manual",

        paymentAmount:
          amount,

        paymentCurrency:
          currency,
      };

    return NextResponse.json({
      success:
        true,

      alreadyConfirmed:
        false,

      emailSent,

      registration:
        publicRegistration(
          updated
        ),
    });
  } catch (error) {
    console.error(
      "Pay-on-site confirmation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not confirm payment at the venue.",
      },
      {
        status: 500,
      }
    );
  }
}
