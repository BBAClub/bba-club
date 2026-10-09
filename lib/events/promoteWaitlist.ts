import "server-only";

import {
  randomUUID,
} from "node:crypto";

import {
  client,
} from "@/sanity/lib/client";

import {
  createComgatePayment,
} from "@/lib/payments/comgate";

import {
  sendEventPaymentRequestEmail,
  sendEventRegistrationEmail,
} from "@/lib/email/sendEventRegistrationEmail";

export type PromotionEvent = {
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

  registrationStatus?:
    | "coming-soon"
    | "open"
    | "closed"
    | "full";
};

export type PromotedRegistration = {
  _id: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  status:
    | "confirmed"
    | "pending-payment";

  paymentRequired: boolean;

  paymentUrl?: string;

  reservationExpiresAt?: string;
};

type Registration = {
  _id: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  status?:
    | "pending-payment"
    | "confirmed"
    | "waitlist"
    | "cancelled"
    | "checked-in";

  ticketCode?: string;

  registeredAt?: string;

  paymentStatus?:
    | "not_required"
    | "pay_on_site"
    | "pending"
    | "paid"
    | "failed"
    | "refunded";

  paymentProvider?: string;

  paymentAmount?: number;

  paymentCurrency?: string;
};

type PromoteWaitlistInput = {
  eventId: string;

  event: PromotionEvent;

  siteOrigin: string;

  excludeRegistrationId?:
    string;
};

function paymentsEnabled() {
  return (
    process.env
      .COMGATE_PAYMENTS_ENABLED ===
    "true"
  );
}

function normalizeOrigin(
  value: string
) {
  return value
    .trim()
    .replace(
      /\/+$/,
      ""
    );
}

function getEventPrice(
  event: PromotionEvent
) {
  if (
    typeof event.price !==
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

function candidateNeedsOnlinePayment(
  registration:
    Registration,

  event:
    PromotionEvent
) {
  const price =
    getEventPrice(
      event
    );

  if (
    price <= 0 ||
    !paymentsEnabled()
  ) {
    return false;
  }

  /*
    Already paid registrations
    must never be charged again.
  */

  if (
    registration
      .paymentStatus ===
      "paid"
  ) {
    return false;
  }

  /*
    Legacy registrations that we
    explicitly mark as pay-on-site
    keep their original agreement.
  */

  if (
    registration
      .paymentStatus ===
      "pay_on_site" ||
    registration
      .paymentProvider ===
      "manual"
  ) {
    return false;
  }

  /*
    Explicit not_required is also
    respected as an exception.
  */

  if (
    registration
      .paymentStatus ===
      "not_required"
  ) {
    return false;
  }

  return true;
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

  const ticketCode =
    randomUUID();

  const writeClient =
    client.withConfig({
      token,

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

async function sendConfirmedEmail(
  registration:
    Registration,

  event:
    PromotionEvent,

  ticketCode:
    string
) {
  if (
    !registration.email ||
    !registration.firstName ||
    !event.title
  ) {
    return false;
  }

  const result =
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

  if (!result.sent) {
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
    result.emailId
  ) {
    emailPatch.confirmationEmailId =
      result.emailId;
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

async function promoteWithoutOnlinePayment(
  registration:
    Registration,

  event:
    PromotionEvent
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

      useCdn:
        false,
    });

  const ticketCode =
    await ensureTicketCode(
      registration
    );

  const price =
    getEventPrice(
      event
    );

  const paymentPatch:
    Record<
      string,
      string | number
    > = {};

  /*
    If online payments are not yet
    enabled, a paid event remains
    pay-on-site.
  */

  if (
    price > 0 &&
    !paymentsEnabled() &&
    registration
      .paymentStatus !==
      "paid"
  ) {
    paymentPatch.paymentStatus =
      "pay_on_site";

    paymentPatch.paymentProvider =
      "manual";

    paymentPatch.paymentAmount =
      price;

    paymentPatch.paymentCurrency =
      "CZK";
  }

  await writeClient
    .patch(
      registration._id
    )
    .set({
      status:
        "confirmed",

      ticketCode,

      ...paymentPatch,
    })
    .unset([
      "checkedInAt",
      "reservationExpiresAt",
      "paymentRedirectUrl",
      "paymentCreatedAt",
    ])
    .commit();

  try {
    await sendConfirmedEmail(
      registration,
      event,
      ticketCode
    );
  } catch (error) {
    console.error(
      "Promoted attendee confirmation email failed:",
      error
    );
  }

  return {
    _id:
      registration._id,

    firstName:
      registration.firstName,

    lastName:
      registration.lastName,

    email:
      registration.email,

    status:
      "confirmed" as const,

    paymentRequired:
      false,
  };
}

async function promoteWithComgate(
  registration:
    Registration,

  event:
    PromotionEvent,

  siteOrigin:
    string
) {
  const token =
    process.env
      .SANITY_API_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      "Missing SANITY_API_WRITE_TOKEN."
    );
  }

  const price =
    getEventPrice(
      event
    );

  if (
    price <= 0
  ) {
    throw new Error(
      "Cannot create payment for a free event."
    );
  }

  if (
    !event.title ||
    !event.slug ||
    !registration.email ||
    !registration.firstName
  ) {
    throw new Error(
      "Waitlist registration is missing information required for payment."
    );
  }

  const writeClient =
    client.withConfig({
      token,

      useCdn:
        false,
    });

  const ticketCode =
    await ensureTicketCode(
      registration
    );

  const paymentCreatedAt =
    new Date();

  const reservationExpiresAt =
    new Date(
      paymentCreatedAt
        .getTime() +
        30 * 60 * 1000
    ).toISOString();

  /*
    Reserve the seat before
    creating the external payment.

    Active pending-payment records
    count towards event capacity.
  */

  await writeClient
    .patch(
      registration._id
    )
    .set({
      status:
        "pending-payment",

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

      ticketCode,
    })
    .unset([
      "checkedInAt",
      "paymentTransactionId",
      "paymentRedirectUrl",
      "paidAt",
      "refundedAt",
    ])
    .commit();

  const origin =
    normalizeOrigin(
      siteOrigin
    );

  const encodedSlug =
    encodeURIComponent(
      event.slug
    );

  const encodedRegistrationId =
    encodeURIComponent(
      registration._id
    );

  const paidUrl =
    `${origin}/events/${encodedSlug}` +
    `?payment=paid` +
    `&registration=${encodedRegistrationId}`;

  const cancelledUrl =
    `${origin}/events/${encodedSlug}` +
    `?payment=cancelled` +
    `&registration=${encodedRegistrationId}`;

  const pendingUrl =
    `${origin}/events/${encodedSlug}` +
    `?payment=pending` +
    `&registration=${encodedRegistrationId}`;

  const refId =
    registration._id.replace(
      /^private\.event-registration-/,
      ""
    );

  try {
    const payment =
      await createComgatePayment(
        {
          amountCzk:
            price,

          refId,

          email:
            registration.email,

          fullName:
            `${registration.firstName} ${registration.lastName ?? ""}`.trim(),

          eventTitle:
            event.title,

          paidUrl,

          cancelledUrl,

          pendingUrl,
        }
      );

    /*
      A waitlist email may already
      have filled these fields.

      Clear them now so the PAID
      webhook will still send the
      real ticket email.
    */

    await writeClient
      .patch(
        registration._id
      )
      .set({
        paymentTransactionId:
          payment.transId,

        paymentRedirectUrl:
          payment.redirectUrl,
      })
      .unset([
        "confirmationEmailSentAt",
        "confirmationEmailId",
      ])
      .commit();

    try {
      await sendEventPaymentRequestEmail(
        {
          registrationId:
            registration._id,

          ticketCode,

          paymentTransactionId:
            payment.transId,

          paymentUrl:
            payment.redirectUrl,

          reservationExpiresAt,

          amountCzk:
            price,

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
    } catch (error) {
      /*
        Do not cancel the payment
        merely because email delivery
        failed.

        The transaction remains
        consistent and can be handled
        manually if necessary.
      */

      console.error(
        "Payment request email failed:",
        error
      );
    }

    return {
      _id:
        registration._id,

      firstName:
        registration.firstName,

      lastName:
        registration.lastName,

      email:
        registration.email,

      status:
        "pending-payment" as const,

      paymentRequired:
        true,

      paymentUrl:
        payment.redirectUrl,

      reservationExpiresAt,
    };
  } catch (error) {
    /*
      Comgate did not create a usable
      transaction.

      Put the person back on the
      waitlist and release the seat.
    */

    await writeClient
      .patch(
        registration._id
      )
      .set({
        status:
          "waitlist",

        paymentStatus:
          "failed",
      })
      .unset([
        "paymentTransactionId",
        "paymentRedirectUrl",
        "paymentCreatedAt",
        "reservationExpiresAt",
      ])
      .commit();

    throw error;
  }
}

export async function promoteWaitlist({
  eventId,
  event,
  siteOrigin,
  excludeRegistrationId,
}: PromoteWaitlistInput) {
  const token =
    process.env
      .SANITY_API_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      "Missing SANITY_API_WRITE_TOKEN."
    );
  }

  /*
    Closed events do not
    automatically promote anybody.
  */

  if (
    event.registrationStatus ===
    "closed"
  ) {
    return [];
  }

  /*
    No fixed capacity means there is
    no seat-based promotion to do.
  */

  if (
    typeof event.capacity !==
      "number" ||
    event.capacity <= 0
  ) {
    return [];
  }

  const now =
    new Date()
      .toISOString();

  /*
    Active payment reservations
    count as occupied seats.
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
        eventId,

        now,
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

  /*
    Oldest waitlist entries always
    get priority.
  */

  const waitlist =
    await client.fetch<
      Registration[]
    >(
      `
        *[
          _type ==
            "eventRegistration"

          && event._ref ==
            $eventId

          && status ==
            "waitlist"
        ]
        | order(
          registeredAt asc
        ) {
          _id,

          firstName,
          lastName,
          email,

          status,

          ticketCode,
          registeredAt,

          paymentStatus,
          paymentProvider,
          paymentAmount,
          paymentCurrency
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
    PromotedRegistration[] =
    [];

  for (
    const candidate
    of candidates
  ) {
    try {
      if (
        candidateNeedsOnlinePayment(
          candidate,
          event
        )
      ) {
        const result =
          await promoteWithComgate(
            candidate,
            event,
            siteOrigin
          );

        promoted.push(
          result
        );

        continue;
      }

      const result =
        await promoteWithoutOnlinePayment(
          candidate,
          event
        );

      promoted.push(
        result
      );
    } catch (error) {
      console.error(
        "Waitlist promotion failed:",
        {
          registrationId:
            candidate._id,

          error,
        }
      );

      /*
        Do not skip over the oldest
        person if their promotion
        fails unexpectedly.
      */

      break;
    }
  }

  return promoted;
}