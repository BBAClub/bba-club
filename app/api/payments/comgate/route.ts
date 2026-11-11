import { comgateAttemptId, isComgateAttemptReference } from "@/lib/payments/comgateAttempt";
import { capacityTransaction, paidRegistrationStatus, readEventCapacity } from "@/lib/events/capacity";
import {
  NextResponse,
} from "next/server";

import {
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import {
  client,
} from "@/sanity/lib/client";

import {
  getComgatePaymentStatus,
} from "@/lib/payments/comgate";

import {
  sendEventPaymentFailedEmail,
  sendEventRegistrationEmail,
} from "@/lib/email/sendEventRegistrationEmail";

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

type ComgatePushBody = {
  merchant?: unknown;

  secret?: unknown;

  transId?: unknown;

  status?: unknown;

  refId?: unknown;

  price?: unknown;

  curr?: unknown;
};

type Registration = {
  _id: string;

  _rev: string;

  status?: RegistrationStatus;

  paymentStatus?: PaymentStatus;

  paymentProvider?: string;

  paymentTransactionId?: string;
  paymentAttemptRef?: string;
  reservationExpiresAt?: string;

  paymentAmount?: number;

  paymentCurrency?: string;

  ticketCode?: string;

  confirmationEmailSentAt?: string;

  firstName?: string;

  lastName?: string;

  email?: string;

  event?: PromotionEvent;
};

function getString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function safeEqual(
  first: string,
  second: string
) {
  const firstBuffer =
    Buffer.from(
      first
    );

  const secondBuffer =
    Buffer.from(
      second
    );

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

function getExpectedRefId(
  registrationId: string
) {
  return registrationId.replace(
    /^private\.event-registration-/,
    ""
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

async function getRegistration(
  transId: string,
  attemptRef?: string,
) {
  return client.fetch<
    Registration | null
  >(
    `
      *[
        _type ==
          "eventRegistration"

        && select(
          defined($attemptRef) => paymentAttemptRef == $attemptRef &&
            !defined(paymentTransactionId) && paymentProvider == "comgate" &&
            status == "pending-payment" && paymentStatus == "pending",
          paymentTransactionId == $transId
        )
      ][0] {
        _id,
        _rev,

        status,
        paymentStatus,
        paymentProvider,

        paymentTransactionId,
        paymentAttemptRef,
        reservationExpiresAt,
        paymentAmount,
        paymentCurrency,

        ticketCode,

        confirmationEmailSentAt,

        firstName,
        lastName,
        email,

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
      }
    `,
    {
      transId, attemptRef: attemptRef ?? null,
    },
    { cache: "no-store" },
  );
}

export async function POST(
  request: Request
) {
  try {
    /*
      SERVER CONFIG
    */

    const merchant =
      process.env
        .COMGATE_MERCHANT;

    const secret =
      process.env
        .COMGATE_SECRET;

    const writeToken =
      process.env
        .SANITY_API_WRITE_TOKEN;

    if (
      !merchant ||
      !secret ||
      !writeToken
    ) {
      console.error(
        "Comgate webhook configuration is incomplete."
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

    /*
      PARSE PUSH NOTIFICATION

      Comgate REST v2 sends JSON.
    */

    let body:
      ComgatePushBody;

    try {
      body =
        (await request.json()) as
          ComgatePushBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid payload.",
        },
        {
          status: 400,
        }
      );
    }

    const incomingMerchant =
      getString(
        body.merchant
      );

    const incomingSecret =
      getString(
        body.secret
      );

    const transId =
      getString(
        body.transId
      );

    /*
      FIRST SECURITY CHECK

      The push notification contains
      merchant + secret.

      We still verify the transaction
      directly with Comgate afterwards.
    */

    if (
      !incomingMerchant ||
      !incomingSecret ||
      !transId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing payment information.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !safeEqual(
        incomingMerchant,
        merchant
      ) ||
      !safeEqual(
        incomingSecret,
        secret
      )
    ) {
      console.error(
        "Rejected unauthenticated Comgate push."
      );

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
      AUTHORITATIVE STATUS CHECK

      Never trust the status from
      the incoming push alone.

      Ask Comgate directly.
    */

    const payment =
      await getComgatePaymentStatus(
        transId
      );

    if (
      payment.transId &&
      payment.transId !==
        transId
    ) {
      console.error(
        "Comgate transaction ID mismatch.",
        {
          incoming:
            transId,

          verified:
            payment.transId,
        }
      );

      return NextResponse.json(
        {
          error:
            "Transaction mismatch.",
        },
        {
          status: 409,
        }
      );
    }

    /*
      FIND OUR REGISTRATION
    */

    let registration =
      await getRegistration(
        transId
      );

    if (!registration && payment.refId) {
      registration = await getRegistration(transId, payment.refId);
    }

    if (!registration && payment.refId && isComgateAttemptReference(payment.refId)) {
      const store = client.withConfig({ token: writeToken, useCdn: false });
      const attempt = await store.getDocument<{
        _rev: string;
        registrationId: string;
        amountInMinorUnits: number;
        currency: string;
        latePaidTransactionId?: string;
      }>(comgateAttemptId(payment.refId));
      if (attempt) {
        if (Number(payment.price) !== attempt.amountInMinorUnits || payment.curr !== attempt.currency ||
            (attempt.latePaidTransactionId && attempt.latePaidTransactionId !== transId)) {
          return NextResponse.json({ error: "Payment does not match the stored attempt." }, { status: 409 });
        }
        const current = await store.getDocument<{
          status?: string;
          paymentAttemptRef?: string;
          paymentTransactionId?: string;
        }>(attempt.registrationId);
        if (current?.paymentTransactionId === transId ||
            (current?.paymentAttemptRef === payment.refId && current.status === "pending-payment")) {
          return NextResponse.json({ error: "Payment is still being linked." }, { status: 503 });
        }

        if (payment.status === "PAID" && !attempt.latePaidTransactionId) {
          await store.patch(comgateAttemptId(payment.refId)).ifRevisionId(attempt._rev)
            .set({
              latePaidTransactionId: transId,
              latePaidRecordedAt: new Date().toISOString(),
            })
            .commit({ visibility: "sync" });
        }
        return NextResponse.json({ success: true, status: payment.status, registrationChanged: false });
      }
    }

    if (!registration) {
      /*
        Returning non-2xx makes
        Comgate retry the push.

        That is preferable to
        acknowledging a payment
        that we cannot match to a
        registration.
      */

      console.error(
        "Comgate payment has no matching registration:",
        transId
      );

      return NextResponse.json(
        {
          error:
            "Registration not found.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      VERIFY PAYMENT IDENTITY
    */

    if (
      registration
        .paymentProvider !==
      "comgate"
    ) {
      console.error(
        "Payment provider mismatch:",
        {
          registrationId:
            registration._id,

          provider:
            registration
              .paymentProvider,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment provider mismatch.",
        },
        {
          status: 409,
        }
      );
    }

    const expectedRefId =
      registration.paymentAttemptRef ?? getExpectedRefId(
        registration._id
      );

    if (
      payment.refId &&
      payment.refId !==
        expectedRefId
    ) {
      console.error(
        "Comgate refId mismatch:",
        {
          registrationId:
            registration._id,

          expected:
            expectedRefId,

          received:
            payment.refId,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment reference mismatch.",
        },
        {
          status: 409,
        }
      );
    }

    /*
      VERIFY AMOUNT + CURRENCY

      paymentAmount is the price
      snapshot stored when the
      checkout was created.

      Comgate returns price in
      haléře.
    */

    if (
      typeof registration
        .paymentAmount !==
        "number"
    ) {
      console.error(
        "Registration has no stored payment amount:",
        registration._id
      );

      return NextResponse.json(
        {
          error:
            "Missing payment amount.",
        },
        {
          status: 409,
        }
      );
    }

    const expectedPrice =
      Math.round(
        registration
          .paymentAmount *
          100
      );

    const verifiedPrice =
      Number(
        payment.price
      );

    if (
      !Number.isFinite(
        verifiedPrice
      ) ||
      verifiedPrice !==
        expectedPrice
    ) {
      console.error(
        "Comgate amount mismatch:",
        {
          registrationId:
            registration._id,

          expected:
            expectedPrice,

          received:
            payment.price,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment amount mismatch.",
        },
        {
          status: 409,
        }
      );
    }

    const expectedCurrency =
      registration
        .paymentCurrency ??
      "CZK";

    if (
      payment.curr !==
        expectedCurrency
    ) {
      console.error(
        "Comgate currency mismatch:",
        {
          registrationId:
            registration._id,

          expected:
            expectedCurrency,

          received:
            payment.curr,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment currency mismatch.",
        },
        {
          status: 409,
        }
      );
    }

    const writeClient =
      client.withConfig({
        token:
          writeToken,

        useCdn:
          false,
      });

    if (!registration.paymentTransactionId) {
      const linked = await writeClient.patch(registration._id)
        .ifRevisionId(registration._rev)
        .set({ paymentTransactionId: transId })
        .commit({ visibility: "sync" });
      registration = { ...registration, _rev: linked._rev, paymentTransactionId: transId };
    }

    /*
      ==================================
      PENDING
      ==================================
    */

    if (
      payment.status ===
      "PENDING"
    ) {
      return NextResponse.json({
        success:
          true,

        status:
          "pending",
      });
    }

    /*
      ==================================
      AUTHORIZED
      ==================================

      We do not use card
      pre-authorization.

      Therefore AUTHORIZED must not
      produce a ticket.

      Keep waiting for a final
      payment state.
    */

    if (
      payment.status ===
      "AUTHORIZED"
    ) {
      console.warn(
        "Unexpected AUTHORIZED Comgate payment:",
        transId
      );

      return NextResponse.json({
        success:
          true,

        status:
          "authorized",
      });
    }

    /*
      ==================================
      CANCELLED / FAILED
      ==================================
    */

    if (
      payment.status ===
      "CANCELLED"
    ) {
      /*
        Never downgrade a payment
        already recorded as paid.
      */

      if (
        registration.paymentStatus === "paid" ||
        registration.paymentStatus === "refunded"
      ) {
        return NextResponse.json({
          success:
            true,

          status:
            registration.paymentStatus,
        });
      }

      await writeClient
        .patch(
          registration._id
        )
        .ifRevisionId(registration._rev)
        .set({
          status:
            "cancelled",

          paymentStatus:
            "failed",
        })
        .unset([
          "reservationExpiresAt",
          "paymentRedirectUrl",
        ])
        .commit();

      /*
        CANCELLED is also the final
        state used when a Comgate
        payment expires.

        The seat is now free, so offer
        it to the next waitlisted
        attendee immediately.
      */

      let promotedCount = 0;

      const event =
        registration.event;

      if (
        registration.email &&
        registration.firstName &&
        registration.paymentTransactionId &&
        event?.title
      ) {
        try {
          await sendEventPaymentFailedEmail({
            registrationId:
              registration._id,

            paymentTransactionId:
              registration.paymentTransactionId,

            amount:
              registration.paymentAmount ??
              event.price ??
              0,

            currency:
              registration.paymentCurrency === "EUR"
                ? "EUR"
                : "CZK",

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
          });
        } catch (emailError) {
          console.error(
            "Payment failed email could not be sent:",
            emailError
          );
        }
      }

      if (
        event?._id
      ) {
        try {
          const promoted =
            await promoteWaitlist({
              eventId:
                event._id,

              event,

              siteOrigin:
                getSiteOrigin(
                  request
                ),

              excludeRegistrationId:
                registration._id,
            });

          promotedCount =
            promoted.length;
        } catch (
          promotionError
        ) {
          /*
            Payment cancellation is
            already safely recorded.

            Promotion failure must not
            make Comgate retry an
            otherwise successfully
            processed CANCELLED push.
          */

          console.error(
            "Waitlist promotion after cancelled payment failed:",
            promotionError
          );
        }
      }

      return NextResponse.json({
        success:
          true,

        status:
          "cancelled",

        promoted:
          promotedCount,
      });
    }

    /*
      ==================================
      PAID
      ==================================
    */

    if (
      payment.status ===
      "PAID"
    ) {
      /*
        A refunded registration must
        never become active again
        because of a duplicate or
        delayed push.
      */

      if (
        registration
          .paymentStatus ===
        "refunded"
      ) {
        return NextResponse.json({
          success:
            true,

          status:
            "refunded",
        });
      }

      let ticketCode =
        registration
          .ticketCode;

      if (!ticketCode) {
        ticketCode =
          randomUUID();
      }

      /*
        Finalize the registration
        only if it has not already
        been finalized.

        Comgate may send the same
        notification more than once,
        so this endpoint must be
        idempotent.
      */

      if (
        registration
          .paymentStatus !==
        "paid"
      ) {
        const eventId = registration.event?._id;
        if (!eventId) throw new Error("Paid registration has no event.");
        const paidAt = new Date().toISOString();
        const capacity = await readEventCapacity(writeClient, eventId, paidAt);
        if (!capacity) throw new Error("Could not read capacity for paid registration.");

        const finalStatus = paidRegistrationStatus(registration, capacity, paidAt);
        const { _id, _rev } = registration;
        await capacityTransaction(writeClient, eventId, capacity._rev)
          .patch(_id, patch => {
            const update = patch.ifRevisionId(_rev).set({
              status: finalStatus,
              paymentStatus: "paid",
              paidAt,
            });
            return finalStatus === "waitlist"
              ? update.unset(["reservationExpiresAt", "ticketCode", "paymentRedirectUrl"])
              : update.set({ ticketCode }).unset(["reservationExpiresAt"]);
          })
          .commit({ visibility: "sync" });

        if (finalStatus === "waitlist") {
          console.warn("Paid registration moved to waitlist because the event is full:", _id);
          return NextResponse.json({ success: true, status: "paid", registrationStatus: "waitlist" });
        }

        /*
          Reload the document before
          sending the confirmation.
        */

        const updated =
          await getRegistration(
            transId
          );

        if (updated) {
          registration =
            updated;
        }
      }

      // A repeated payment notification must not issue a ticket for a paid waitlist entry.
      if (registration.status === "waitlist") {
        return NextResponse.json({ success: true, status: "paid", registrationStatus: "waitlist" });
      }

      /*
        CONFIRMATION EMAIL

        Only send if it has not
        already been successfully
        recorded.

        This also means a retried
        Comgate push can retry a
        failed email without creating
        another ticket.
      */

      let confirmationEmailSent = Boolean(registration.confirmationEmailSentAt);
      if (
        !registration
          .confirmationEmailSentAt
      ) {
        const event =
          registration.event;

        if (
          !registration.email ||
          !registration.firstName ||
          !event?.title
        ) {
          console.error(
            "Paid registration is missing email data:",
            registration._id
          );

          return NextResponse.json(
            {
              error:
                "Registration data is incomplete.",
            },
            {
              status: 500,
            }
          );
        }

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
                  registration
                    .firstName,

                email:
                  registration
                    .email,

                paidAmount: registration.paymentAmount,
                paidCurrency: expectedCurrency === "EUR" ? "EUR" : "CZK",

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
            !emailResult.sent
          ) {
            /*
              The payment is already
              safely recorded as paid.

              Email delivery must not
              make Comgate retry the
              payment notification.
            */

            console.error(
              "Paid registration confirmation email was not sent:",
              registration._id
            );

            await writeClient
              .patch(
                registration._id
              )
              .set({
                emailDeliveryStatus:
                  "failed",
              })
              .commit();
          } else {
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
              .set({
                ...emailPatch,

                emailDeliveryStatus:
                  "sent",
              })
              .commit();
            confirmationEmailSent = true;
          }
        } catch (
          emailError
        ) {
          console.error(
            "Paid registration confirmation email failed:",
            emailError
          );

          try {
            await writeClient
              .patch(
                registration._id
              )
              .set({
                emailDeliveryStatus:
                  "failed",
              })
              .commit();
          } catch (
            emailStatusError
          ) {
            console.error(
              "Could not record failed confirmation email status:",
              emailStatusError
            );
          }
        }
      }

      return NextResponse.json({
        success:
          true,

        status:
          "paid",
        confirmationEmailSent,
      });
    }

    /*
      Defensive fallback.
    */

    console.error(
      "Unexpected Comgate payment status:",
      payment.status
    );

    return NextResponse.json(
      {
        error:
          "Unexpected payment status.",
      },
      {
        status: 500,
      }
    );
  } catch (error) {
    console.error(
      "Comgate push processing failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not process payment notification.",
      },
      {
        status: 500,
      }
    );
  }
}