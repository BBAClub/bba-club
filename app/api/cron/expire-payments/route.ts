import { sendDueEventTickets } from "@/lib/email/sendDueEventTickets";

import {
  timingSafeEqual,
} from "node:crypto";

import {
  NextResponse,
} from "next/server";

import {
  client,
} from "@/sanity/lib/client";

import {
  cancelComgatePayment,
  getComgatePaymentStatus,
  type ComgatePaymentStatus,
} from "@/lib/payments/comgate";

export const maxDuration = 120;

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type ExpiredRegistration = {
  _id: string;

  paymentTransactionId?: string;

  reservationExpiresAt?: string;
};

function safeEqual(
  first: string,
  second: string
) {
  const firstBuffer =
    Buffer.from(first);

  const secondBuffer =
    Buffer.from(second);

  if (
    firstBuffer.length !==
    secondBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    firstBuffer,
    secondBuffer
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

async function processThroughWebhook(
  request: Request,
  transId: string
) {
  const merchant =
    process.env
      .COMGATE_MERCHANT
      ?.trim();

  const secret =
    process.env
      .COMGATE_SECRET
      ?.trim();

  if (
    !merchant ||
    !secret
  ) {
    throw new Error(
      "Comgate credentials are not configured."
    );
  }

  const response =
    await fetch(
      `${getSiteOrigin(
        request
      )}/api/payments/comgate`,
      {
        method:
          "POST",
        signal: AbortSignal.timeout(15_000),

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            merchant,
            secret,
            transId,
          }),

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    const text =
      await response.text();

    throw new Error(
      `Comgate webhook processing failed (${response.status}): ${text}`
    );
  }
  return (await response.json()) as { confirmationEmailSent?: boolean };
}

export async function GET(
  request: Request
) {
  try {
    /*
      ==================================
      AUTHENTICATION
      ==================================

      This endpoint is called by an
      external scheduler.

      CRON_SECRET must be sent as:

      Authorization: Bearer <secret>
    */

    const cronSecret =
      process.env
        .CRON_SECRET
        ?.trim();

    if (!cronSecret) {
      console.error(
        "CRON_SECRET is not configured."
      );

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

    const authorization =
      request.headers
        .get(
          "authorization"
        )
        ?.trim() ?? "";

    const expected =
      `Bearer ${cronSecret}`;

    if (
      !safeEqual(
        authorization,
        expected
      )
    ) {
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
      ==================================
      FIND EXPIRED RESERVATIONS
      ==================================

      Only active Comgate payment
      reservations whose 30-minute
      hold has already expired.

      Limit each run so one scheduler
      request cannot run forever.
    */

    const now =
      new Date()
        .toISOString();

    const ticketDelivery = await sendDueEventTickets().catch(error => {
      console.error("Scheduled ticket check failed:", error instanceof Error ? error.name : "Unknown error");
      return { error: "Could not process scheduled tickets." };
    });
    const ticketDeliveryFailed =
      "error" in ticketDelivery || ticketDelivery.failed > 0;

    const registrations =
      await client.fetch<
        ExpiredRegistration[]
      >(
        `
          *[
            _type ==
              "eventRegistration"

            && status ==
              "pending-payment"

            && paymentStatus ==
              "pending"

            && paymentProvider ==
              "comgate"

            && defined(
              paymentTransactionId
            )

            && defined(
              reservationExpiresAt
            )

            && reservationExpiresAt <=
              $now
          ]
          | order(
              reservationExpiresAt asc
            )
          [0...25] {
            _id,

            paymentTransactionId,
            reservationExpiresAt
          }
        `,
        {
          now,
        }
      );

    const results: Array<{
      registrationId: string;

      transId?: string;

      result:
        | "paid"
        | "cancelled"
        | "authorized"
        | "pending"
        | "error";

      error?: string;
    }> = [];

    for (
      const registration
      of registrations
    ) {
      const transId =
        registration
          .paymentTransactionId
          ?.trim();

      if (!transId) {
        results.push({
          registrationId:
            registration._id,

          result:
            "error",

          error:
            "Missing transaction ID.",
        });

        continue;
      }

      try {
        const payment =
          await getComgatePaymentStatus(
            transId
          );

        let status:
          ComgatePaymentStatus =
            payment.status!;

        /*
          If Comgate still reports
          PENDING after our own
          reservation deadline, cancel
          it before freeing the seat.

          cancelComgatePayment()
          verifies the authoritative
          state again afterwards.
        */

        if (
          status ===
          "PENDING"
        ) {
          const cancellation =
            await cancelComgatePayment(
              transId
            );

          status =
            cancellation.status!;
        }

        /*
          PAID and CANCELLED are final
          states already handled by
          our existing Comgate webhook.

          Reuse that exact logic so:
          - PAID creates the ticket
          - CANCELLED sends fallback mail
          - waitlist promotion stays identical
          - amount/currency/refId checks stay
            in one place
        */

        if (
          status === "PAID" ||
          status === "CANCELLED"
        ) {
          await processThroughWebhook(
            request,
            transId
          );

          results.push({
            registrationId:
              registration._id,

            transId,

            result:
              status === "PAID"
                ? "paid"
                : "cancelled",
          });

          continue;
        }

        /*
          AUTHORIZED is deliberately
          left untouched.

          We do not issue a ticket until
          Comgate reaches PAID.
        */

        if (
          status ===
          "AUTHORIZED"
        ) {
          results.push({
            registrationId:
              registration._id,

            transId,

            result:
              "authorized",
          });

          continue;
        }

        results.push({
          registrationId:
            registration._id,

          transId,

          result:
            "pending",
        });
      } catch (error) {
        console.error(
          "Expired payment processing failed:",
          {
            registrationId:
              registration._id,

            transId,

            error,
          }
        );

        results.push({
          registrationId:
            registration._id,

          transId,

          result:
            "error",

          error:
            error instanceof Error
              ? error.message
              : "Unknown error.",
        });
      }
    }

    const receipts = await client.fetch<{ paymentTransactionId: string }[]>(
      `*[_type == "eventRegistration" && status in ["confirmed", "checked-in"] &&
        paymentStatus == "paid" && paymentProvider == "comgate" &&
        defined(paymentTransactionId) && !defined(confirmationEmailSentAt) &&
        paidAt >= $recent && _updatedAt <= $retryBefore]
        | order(_updatedAt asc)[0...5] { paymentTransactionId }`,
      {
        recent: new Date(Date.now() - 23 * 60 * 60_000).toISOString(),
        retryBefore: new Date(Date.now() - 5 * 60_000).toISOString(),
      },
      { cache: "no-store" },
    );
    let receiptRetryErrors = 0;
    for (const { paymentTransactionId } of receipts) {
      try {
        const result = await processThroughWebhook(request, paymentTransactionId);
        if (!result.confirmationEmailSent) receiptRetryErrors++;
      } catch {
        receiptRetryErrors++;
      }
    }

    const failed = ticketDeliveryFailed || receiptRetryErrors > 0 || results.some(item => item.result === "error");
    return NextResponse.json({
      ticketDelivery,
      receiptRetries: { attempted: receipts.length, errors: receiptRetryErrors },
      success: !failed,

      checked:
        registrations.length,

      paid:
        results.filter(
          (item) =>
            item.result ===
            "paid"
        ).length,

      cancelled:
        results.filter(
          (item) =>
            item.result ===
            "cancelled"
        ).length,

      authorized:
        results.filter(
          (item) =>
            item.result ===
            "authorized"
        ).length,

      stillPending:
        results.filter(
          (item) =>
            item.result ===
            "pending"
        ).length,

      errors:
        results.filter(
          (item) =>
            item.result ===
            "error"
        ).length,

      results,
    }, { status: failed ? 503 : 200 });
  } catch (error) {
    console.error(
      "Expired payment cron failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not process expired payments.",
      },
      {
        status: 500,
      }
    );
  }
}
