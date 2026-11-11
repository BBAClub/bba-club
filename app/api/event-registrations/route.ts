import { comgateAttemptDocument } from "@/lib/payments/comgateAttempt";
import { linkComgateCheckout } from "@/lib/payments/linkComgateCheckout";
import { takeRequestQuota, trustedRequestIp } from "@/lib/requestRateLimit";
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
  createComgatePayment,
  getComgatePaymentStatus,
} from "@/lib/payments/comgate";

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

type EventDocument = {
  _id: string;
  _rev: string;

  title?: string;
  slug?: string;

  date?: string;
  time?: string;

  location?: string;
  venue?: string;
  address?: string;

  capacity?: number;

  price?: number;
  onlinePaymentsEnabled?: boolean;

  registrationStatus?:
    | "coming-soon"
    | "open"
    | "closed"
    | "full";

  registrationDeadline?: string;
};

type ExistingRegistration = {
  _id: string;
  _rev: string;

  status?: RegistrationStatus;

  paymentStatus?: PaymentStatus;

  registeredAt?: string;

  ticketCode?: string;

  email?: string;

  paymentTransactionId?: string;

  paymentRedirectUrl?: string;

  reservationExpiresAt?: string;
};

type RegistrationBody = {
  eventSlug?: unknown;

  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;

  university?: unknown;
  note?: unknown;

  website?: unknown;
};

type RegistrationFields = {
  status: RegistrationStatus;

  registeredAt: string;

  firstName: string;
  lastName: string;
  email: string;

  ticketCode?: string;

  university?: string;
  note?: string;

  paymentStatus?: PaymentStatus;

  paymentProvider?: string;

  paymentAmount?: number;

  paymentCurrency?: string;

  paymentCreatedAt?: string;
  paymentAttemptRef?: string;

  reservationExpiresAt?: string;
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

function validFutureDate(
  value?: string
) {
  if (!value) {
    return false;
  }

  const parsed =
    new Date(value);

  return (
    !Number.isNaN(
      parsed.getTime()
    ) &&
    parsed.getTime() >
      Date.now()
  );
}

export async function POST(
  request: Request
) {
  try {
    if (Number(request.headers.get("content-length")) > 16_384) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    const source = trustedRequestIp(request);
    if (source && !(await takeRequestQuota("registration:source", source, 40))) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

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

    const writeClient =
      client.withConfig({
        token:
          writeToken,

        useCdn:
          false,
      });

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

      Price is loaded only from
      Sanity.
    */

    if (!(await takeRequestQuota("registration:contact", JSON.stringify([eventSlug, email]), 8))) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const event =
      await writeClient.fetch<
        EventDocument | null
      >(
        `
          *[
            _type == "event"
            && slug.current == $eventSlug
          ][0] {
            _id,
            _rev,

            title,

            "slug":
              slug.current,

            date,
            time,

            location,
            venue,
            address,

            capacity,
            price,
            onlinePaymentsEnabled,

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
      PRICE

      Missing / zero / negative
      price is treated as free.
    */

    const price =
      typeof event.price ===
        "number" &&
      Number.isFinite(
        event.price
      ) &&
      event.price > 0
        ? event.price
        : 0;

    const onlinePaymentRequired =
      paymentsEnabled() &&
      event.onlinePaymentsEnabled === true &&
      price > 0;

    /*
      DUPLICATE CHECK
    */

    let existing =
      await writeClient.fetch<
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
            _rev,

            status,
            paymentStatus,

            registeredAt,
            ticketCode,
            email,

            paymentTransactionId,
            paymentRedirectUrl,
            reservationExpiresAt
          }
        `,
        {
          eventId:
            event._id,

          email,
        }
      );

    /*
      EXISTING PAYMENT SESSION
    */

    if (
      existing?.status ===
        "pending-payment"
    ) {
      if (
        validFutureDate(
          existing
            .reservationExpiresAt
        ) &&
        existing
          .paymentRedirectUrl
      ) {
        return NextResponse.json(
          {
            success:
              true,

            paymentRequired:
              true,

            status:
              "pending-payment",

            eventTitle:
              event.title,

            paymentUrl:
              existing
                .paymentRedirectUrl,
          },
          {
            status: 200,
          }
        );
      }

      if (validFutureDate(existing.reservationExpiresAt)) {
        return NextResponse.json(
          { error: "Your payment is still being prepared. Please try again shortly.", code: "PAYMENT_PENDING" },
          { status: 409 },
        );
      }

      /*
        Reservation expired.

        Verify the old Comgate
        transaction before creating
        another one.
      */

      if (
        existing
          .paymentTransactionId
      ) {
        try {
          const previousPayment =
            await getComgatePaymentStatus(
              existing
                .paymentTransactionId
            );

          if (
            previousPayment.status ===
              "PAID" ||
            previousPayment.status ===
              "AUTHORIZED"
          ) {
            return NextResponse.json(
              {
                error:
                  "Your payment has already been received and is being processed.",

                code:
                  "PAYMENT_PROCESSING",
              },
              {
                status: 409,
              }
            );
          }

          if (
            previousPayment.status ===
            "PENDING"
          ) {
            return NextResponse.json(
              {
                error:
                  "Your previous payment is still being processed. Please try again shortly.",

                code:
                  "PAYMENT_PENDING",
              },
              {
                status: 409,
              }
            );
          }

          if (
            previousPayment.status ===
            "CANCELLED"
          ) {
            const cancelled = await writeClient
              .patch(
                existing._id
              )
              .ifRevisionId(existing._rev)
              .set({
                status:
                  "cancelled",

                paymentStatus:
                  "failed",
              })
              .unset([
                "reservationExpiresAt",
              ])
              .commit();

            existing = {
              ...existing,
              _rev: cancelled._rev,

              status:
                "cancelled",

              paymentStatus:
                "failed",
            };
          }
        } catch (
          paymentCheckError
        ) {
          console.error(
            "Previous Comgate payment verification failed:",
            paymentCheckError
          );

          return NextResponse.json(
            {
              error:
                "We could not verify your previous payment. Please try again shortly.",
            },
            {
              status: 503,
            }
          );
        }
      } else {
        const cancelled = await writeClient
          .patch(
            existing._id
          )
          .ifRevisionId(existing._rev)
          .set({
            status:
              "cancelled",

            paymentStatus:
              "failed",
          })
          .unset([
            "reservationExpiresAt",
          ])
          .commit();

        existing = {
          ...existing,
          _rev: cancelled._rev,

          status:
            "cancelled",

          paymentStatus:
            "failed",
        };
      }
    }

    /*
      EXISTING ACTIVE REGISTRATION
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

      Occupied:
      - confirmed
      - checked-in
      - active pending payment
    */

    const capacity = await readEventCapacity(writeClient, event._id);
    if (!capacity || capacity._rev !== event._rev) {
      return NextResponse.json({ error: "Event changed. Please try again." }, { status: 409 });
    }
    const eventIsFull = capacity.registrationStatus === "full" ||
      (typeof capacity.capacity === "number" && capacity.capacity > 0 &&
        capacity.occupied >= capacity.capacity);

    const registeredAt =
      new Date()
        .toISOString();

    /*
      PRIVATE DOCUMENT ID
    */

    let registrationId =
      createPrivateRegistrationId();

    if (
      existing &&
      existing.status ===
        "cancelled" &&
      existing._id.includes(
        "."
      )
    ) {
      registrationId =
        existing._id;
    }

    const saveRegistration = async (fields: RegistrationFields, unsetFields: string[]) => {
      const transaction = capacityTransaction(writeClient, event._id, capacity._rev);
      if (existing?.status === "cancelled" && existing._id === registrationId) {
        transaction.patch(registrationId, patch =>
          patch.ifRevisionId(existing._rev).set(fields).unset(unsetFields),
        );
      } else {
        if (existing?.status === "cancelled") transaction.delete(existing._id);
        transaction.create({
          _id: registrationId,
          _type: "eventRegistration",
          event: { _type: "reference", _ref: event._id },
          ...fields,
        });
      }
      if (fields.paymentAttemptRef && fields.paymentAmount !== undefined && fields.paymentCurrency) {
        transaction.create(comgateAttemptDocument(
          fields.paymentAttemptRef, registrationId, event._id, fields.paymentAmount, fields.paymentCurrency,
        ));
      }
      await transaction.commit({ visibility: "sync" });
    };

    /*
      ==================================
      FULL EVENT → WAITLIST
      ==================================
    */

    if (eventIsFull) {
      const ticketCode =
        randomUUID();

      const waitlistFields:
        RegistrationFields = {
          status:
            "waitlist",

          registeredAt,

          firstName,
          lastName,
          email,

          ticketCode,

          ...(price > 0
            ? {
                paymentAmount:
                  price,

                paymentCurrency:
                  "CZK",
              }
            : {}),

          paymentStatus:
            price > 0
              ? (
                  onlinePaymentRequired
                    ? undefined
                    : "pay_on_site"
                )
              : "not_required",

          paymentProvider:
            price > 0 &&
            !onlinePaymentRequired
              ? "manual"
              : undefined,

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
        };

      const unsetFields = [
        "checkedInAt",

        "confirmationEmailSentAt",
        "confirmationEmailId",

        "paymentTransactionId",
        "paymentRedirectUrl",
        "paymentCreatedAt",
        "reservationExpiresAt",

        "paidAt",
        "refundedAt",
      ];

      if (!university) {
        unsetFields.push(
          "university"
        );
      }

      if (!note) {
        unsetFields.push(
          "note"
        );
      }

      await saveRegistration(waitlistFields, unsetFields);

      /*
        WAITLIST POSITION
      */

      const waitlistPosition =
        await writeClient.fetch<number>(
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

      /*
        WAITLIST EMAIL
      */

      let emailSent =
        false;

      try {
        const emailResult =
          await sendEventRegistrationEmail(
            {
              registrationId,

              ticketCode,

              status:
                "waitlist",

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
          "Waitlist email failed:",
          emailError
        );
      }

      return NextResponse.json(
        {
          success:
            true,

          paymentRequired:
            false,

          status:
            "waitlist",

          eventTitle:
            event.title,

          waitlistPosition,

          emailSent,
        },
        {
          status:
            201,
        }
      );
    }

    /*
      ==================================
      PAID EVENT → COMGATE
      ==================================
    */

    if (
      onlinePaymentRequired
    ) {
      const paymentCreatedAt =
        new Date();

      const reservationExpiresAt =
        new Date(
          paymentCreatedAt.getTime() +
            30 * 60 * 1000
        ).toISOString();

      const paymentRefId = randomUUID();
      const paymentFields:
        RegistrationFields = {
          status:
            "pending-payment",

          registeredAt,

          firstName,
          lastName,
          email,

          paymentStatus:
            "pending",

          paymentProvider:
            "comgate",

          paymentAmount:
            price,

          paymentCurrency:
            "CZK",

          paymentCreatedAt:
            paymentCreatedAt
              .toISOString(),

          reservationExpiresAt,
          paymentAttemptRef: paymentRefId,

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
        };

      const unsetFields = [
        "ticketCode",

        "checkedInAt",

        "confirmationEmailSentAt",
        "confirmationEmailId",

        "paymentTransactionId",
        "paymentRedirectUrl",

        "paidAt",
        "refundedAt",
      ];

      if (!university) {
        unsetFields.push(
          "university"
        );
      }

      if (!note) {
        unsetFields.push(
          "note"
        );
      }

      await saveRegistration(paymentFields, unsetFields);

      /*
        CREATE COMGATE PAYMENT
      */

      const origin =
        getSiteOrigin(
          request
        );

      const encodedRegistrationId =
        encodeURIComponent(
          registrationId
        );

      const encodedEventSlug =
        encodeURIComponent(
          eventSlug
        );

      const paidUrl =
        `${origin}/events/${encodedEventSlug}` +
        `?payment=paid` +
        `&registration=${encodedRegistrationId}`;

      const cancelledUrl =
        `${origin}/events/${encodedEventSlug}` +
        `?payment=cancelled` +
        `&registration=${encodedRegistrationId}`;

      const pendingUrl =
        `${origin}/events/${encodedEventSlug}` +
        `?payment=pending` +
        `&registration=${encodedRegistrationId}`;

      try {
        const payment =
          await createComgatePayment(
            {
              amountCzk:
                price,

              refId:
                paymentRefId,

              email,

              fullName:
                `${firstName} ${lastName}`.trim(),

              eventTitle:
                event.title,

              paidUrl,

              cancelledUrl,

              pendingUrl,
            }
          );

        await linkComgateCheckout(writeClient, registrationId, paymentRefId, payment);

        return NextResponse.json(
          {
            success:
              true,

            paymentRequired:
              true,

            status:
              "pending-payment",

            eventTitle:
              event.title,

            paymentUrl:
              payment.redirectUrl,

            reservationExpiresAt,
          },
          {
            status:
              201,
          }
        );
      } catch (
        paymentError
      ) {
        console.error(
          "Comgate payment creation failed:",
          paymentError
        );

        return NextResponse.json(
          {
            error:
              "We could not start the payment. Please try again.",
          },
          {
            status:
              502,
          }
        );
      }
    }

    /*
      ==================================
      FREE / PAY-ON-SITE FLOW
      ==================================
    */

    const ticketCode =
      randomUUID();

    const registrationFields:
      RegistrationFields = {
        status:
          "confirmed",

        registeredAt,

        firstName,
        lastName,
        email,

        ticketCode,

        paymentStatus:
          price > 0
            ? "pay_on_site"
            : "not_required",

        paymentProvider:
          price > 0
            ? "manual"
            : undefined,

        paymentAmount:
          price > 0
            ? price
            : undefined,

        paymentCurrency:
          price > 0
            ? "CZK"
            : undefined,

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
      };

    const unsetFields = [
      "checkedInAt",

      "confirmationEmailSentAt",
      "confirmationEmailId",

      "paymentTransactionId",
      "paymentRedirectUrl",
      "paymentCreatedAt",
      "reservationExpiresAt",

      "paidAt",
      "refundedAt",
    ];

    if (!university) {
      unsetFields.push(
        "university"
      );
    }

    if (!note) {
      unsetFields.push(
        "note"
      );
    }

    await saveRegistration(registrationFields, unsetFields);

    /*
      CONFIRMATION EMAIL
    */

    let emailSent =
      false;

    try {
      const emailResult =
        await sendEventRegistrationEmail(
          {
            registrationId,

            ticketCode,

            status:
              "confirmed",

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

    return NextResponse.json(
      {
        success:
          true,

        paymentRequired:
          false,

        status:
          "confirmed",

        eventTitle:
          event.title,

        ticketCode,

        emailSent,
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    if (capacityConflict(error)) {
      return NextResponse.json({ error: "Registration changed. Please try again." }, { status: 409 });
    }
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