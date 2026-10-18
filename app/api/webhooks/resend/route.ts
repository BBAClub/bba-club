import {
  NextResponse,
} from "next/server";

import {
  Resend,
} from "resend";

import {
  client,
} from "@/sanity/lib/client";

export const runtime =
  "nodejs";

type ResendWebhookEvent = {
  type?: string;

  created_at?: string;

  data?: {
    email_id?: string;
  };
};

type EmailDeliveryStatus =
  | "sent"
  | "delayed"
  | "delivered"
  | "bounced"
  | "complained"
  | "failed";

type Registration = {
  _id: string;

  emailDeliveryStatus?:
    EmailDeliveryStatus;
};

type EmailUpdate = {
  emailDeliveryStatus:
    EmailDeliveryStatus;

  emailDeliveredAt?: string;
  emailDelayedAt?: string;
  emailBouncedAt?: string;
  emailComplainedAt?: string;
  emailFailedAt?: string;
};

function eventTimestamp(
  event: ResendWebhookEvent
) {
  if (event.created_at) {
    const date =
      new Date(
        event.created_at
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date
        .toISOString();
    }
  }

  return new Date()
    .toISOString();
}

function shouldIgnoreTransition(
  current:
    EmailDeliveryStatus
    | undefined,

  next:
    EmailDeliveryStatus
) {
  /*
    Do not allow a late
    email.sent webhook to overwrite
    a more useful final state.
  */

  if (
    next === "sent" &&
    (
      current ===
        "delivered" ||
      current ===
        "bounced" ||
      current ===
        "complained" ||
      current ===
        "failed"
    )
  ) {
    return true;
  }

  /*
    A complaint is more important
    than the previous delivered
    state, so it is allowed to
    replace it.

    Other terminal states should
    not normally be replaced by a
    later delivered event.
  */

  if (
    next === "delivered" &&
    (
      current ===
        "bounced" ||
      current ===
        "complained" ||
      current ===
        "failed"
    )
  ) {
    return true;
  }

  return false;
}

function getEmailUpdate(
  event:
    ResendWebhookEvent,

  currentStatus:
    EmailDeliveryStatus
    | undefined
):
  | EmailUpdate
  | null {
  const timestamp =
    eventTimestamp(
      event
    );

  let update:
    EmailUpdate
    | null =
    null;

  switch (event.type) {
    case "email.sent":
      update = {
        emailDeliveryStatus:
          "sent",
      };
      break;

    case "email.delivered":
      update = {
        emailDeliveryStatus:
          "delivered",

        emailDeliveredAt:
          timestamp,
      };
      break;

    case "email.bounced":
      update = {
        emailDeliveryStatus:
          "bounced",

        emailBouncedAt:
          timestamp,
      };
      break;

    case "email.complained":
      update = {
        emailDeliveryStatus:
          "complained",

        emailComplainedAt:
          timestamp,
      };
      break;

    case "email.failed":
      update = {
        emailDeliveryStatus:
          "failed",

        emailFailedAt:
          timestamp,
      };
      break;

    /*
      Resend also supports
      email.delivery_delayed.

      We will add a visible
      "Delayed" state in the next
      schema/UI step, so for now
      this event is accepted but
      does not modify the record.
    */

    case "email.delivery_delayed":
      update = {
        emailDeliveryStatus:
          "delayed",

        emailDelayedAt:
          timestamp,
      };
      break;

    default:
      return null;
  }

  if (
    shouldIgnoreTransition(
      currentStatus,
      update
        .emailDeliveryStatus
    )
  ) {
    return null;
  }

  return update;
}

export async function POST(
  request: Request
) {
  /*
    IMPORTANT:
    Resend signature verification
    requires the untouched raw body.
  */

  const payload =
    await request.text();

  const webhookSecret =
    process.env
      .RESEND_WEBHOOK_SECRET;

  const resendApiKey =
    process.env
      .RESEND_API_KEY;

  const sanityWriteToken =
    process.env
      .SANITY_API_WRITE_TOKEN;

  if (
    !webhookSecret ||
    !resendApiKey ||
    !sanityWriteToken
  ) {
    console.error(
      "Resend webhook configuration is incomplete."
    );

    return NextResponse.json(
      {
        error:
          "Webhook configuration is incomplete.",
      },
      {
        status: 500,
      }
    );
  }

  const svixId =
    request.headers.get(
      "svix-id"
    );

  const svixTimestamp =
    request.headers.get(
      "svix-timestamp"
    );

  const svixSignature =
    request.headers.get(
      "svix-signature"
    );

  if (
    !svixId ||
    !svixTimestamp ||
    !svixSignature
  ) {
    return NextResponse.json(
      {
        error:
          "Missing webhook signature headers.",
      },
      {
        status: 400,
      }
    );
  }

  /*
    VERIFY RESEND SIGNATURE
  */

  let event:
    ResendWebhookEvent;

  try {
    const resend =
      new Resend(
        resendApiKey
      );

    const verified =
      resend.webhooks.verify({
        payload,

        headers: {
          id:
            svixId,

          timestamp:
            svixTimestamp,

          signature:
            svixSignature,
        },

        webhookSecret,
      });

    event =
      verified as
        ResendWebhookEvent;
  } catch (error) {
    console.error(
      "Invalid Resend webhook signature:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Invalid webhook signature.",
      },
      {
        status: 400,
      }
    );
  }

  /*
    IGNORE EVENTS WE DO NOT USE
  */

  const supportedEvents =
    new Set([
      "email.sent",
      "email.delivered",
      "email.delivery_delayed",
      "email.bounced",
      "email.complained",
      "email.failed",
    ]);

  if (
    !event.type ||
    !supportedEvents.has(
      event.type
    )
  ) {
    return NextResponse.json({
      success: true,
      ignored: true,
    });
  }

  const emailId =
    event.data
      ?.email_id
      ?.trim();

  if (!emailId) {
    console.warn(
      "Resend webhook did not contain an email ID.",
      event.type
    );

    return NextResponse.json({
      success: true,
      ignored: true,
    });
  }

  /*
    FIND REGISTRATION

    confirmationEmailId contains
    the ID returned by Resend when
    the registration email was
    created.
  */

  const registration =
    await client.fetch<
      Registration | null
    >(
      `
        *[
          _type ==
            "eventRegistration"

          && confirmationEmailId ==
            $emailId
        ][0] {
          _id,
          emailDeliveryStatus
        }
      `,
      {
        emailId,
      }
    );

  /*
    Other BBA Club emails may also
    generate Resend webhook events.

    If the email does not belong to
    an event registration, simply
    acknowledge it.
  */

  if (!registration) {
    return NextResponse.json({
      success: true,
      matched: false,
    });
  }

  const update =
    getEmailUpdate(
      event,
      registration
        .emailDeliveryStatus
    );

  if (!update) {
    return NextResponse.json({
      success: true,
      matched: true,
      ignored: true,
    });
  }

  /*
    UPDATE SANITY
  */

  const writeClient =
    client.withConfig({
      token:
        sanityWriteToken,

      useCdn:
        false,
    });

  await writeClient
    .patch(
      registration._id
    )
    .set(
      update
    )
    .commit();

  console.log(
    "Resend delivery status updated:",
    {
      registrationId:
        registration._id,

      emailId,

      eventType:
        event.type,

      status:
        update
          .emailDeliveryStatus,
    }
  );

  return NextResponse.json({
    success: true,
    matched: true,
    status:
      update
        .emailDeliveryStatus,
  });
}
