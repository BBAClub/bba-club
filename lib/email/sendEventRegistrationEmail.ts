import {
  Resend,
} from "resend";

import QRCode from "qrcode";

import {
  createCancellationToken,
} from "@/lib/events/cancellationToken";

type SendEventRegistrationEmailProps = {
  registrationId: string;

  ticketCode: string;

  status:
    | "confirmed"
    | "waitlist";

  firstName: string;
  email: string;

  eventTitle: string;

  date?: string;
  time?: string;

  venue?: string;
  location?: string;
  address?: string;

  waitlistPosition?: number;
};

type SendEventPaymentRequestEmailProps = {
  registrationId: string;

  ticketCode?: string;

  paymentTransactionId: string;

  paymentUrl: string;

  reservationExpiresAt: string;

  amountCzk: number;

  firstName: string;
  email: string;

  eventTitle: string;

  date?: string;
  time?: string;

  venue?: string;
  location?: string;
  address?: string;
};

function escapeHtml(
  value: string
) {
  return value
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function formatEventDate(
  date?: string
) {
  if (!date) {
    return undefined;
  }

  const parsed =
    new Date(
      `${date}T12:00:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(parsed);
}

function formatPaymentDeadline(
  value: string
) {
  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return undefined;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "numeric",

      month:
        "short",

      hour:
        "2-digit",

      minute:
        "2-digit",

      timeZone:
        "Europe/Prague",

      timeZoneName:
        "short",
    }
  ).format(parsed);
}

function formatPrice(
  amountCzk: number
) {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style:
        "currency",

      currency:
        "CZK",

      minimumFractionDigits:
        0,

      maximumFractionDigits:
        2,
    }
  ).format(amountCzk);
}

async function createTicketQr(
  ticketCode: string
) {
  const qrPayload =
    `bba-ticket:${ticketCode}`;

  const buffer =
    await QRCode.toBuffer(
      qrPayload,
      {
        type:
          "png",

        errorCorrectionLevel:
          "M",

        width:
          360,

        margin:
          2,
      }
    );

  return buffer.toString(
    "base64"
  );
}

function createCancellationUrl(
  registrationId: string,
  ticketCode: string
) {
  const siteUrl =
    process.env
      .NEXT_PUBLIC_SITE_URL
      ?.trim()
      .replace(
        /\/+$/,
        ""
      );

  if (!siteUrl) {
    return undefined;
  }

  try {
    const token =
      createCancellationToken(
        registrationId,
        ticketCode
      );

    const params =
      new URLSearchParams({
        id:
          registrationId,

        token,
      });

    return `${siteUrl}/events/cancel?${params.toString()}`;
  } catch (error) {
    console.error(
      "Could not create cancellation link:",
      error
    );

    return undefined;
  }
}

function createEventInfoHtml({
  date,
  time,
  venue,
  location,
  address,
}: {
  date?: string;
  time?: string;
  venue?: string;
  location?: string;
  address?: string;
}) {
  const formattedDate =
    formatEventDate(
      date
    );

  const place =
    venue ??
    location;

  return [
    formattedDate
      ? `
        <tr>
          <td style="
            padding: 7px 0;
            color: #71869A;
          ">
            Date
          </td>

          <td style="
            padding: 7px 0;
            text-align: right;
            color: #F6F8FB;
            font-weight: 600;
          ">
            ${escapeHtml(
              formattedDate
            )}
          </td>
        </tr>
      `
      : "",

    time
      ? `
        <tr>
          <td style="
            padding: 7px 0;
            color: #71869A;
          ">
            Time
          </td>

          <td style="
            padding: 7px 0;
            text-align: right;
            color: #F6F8FB;
            font-weight: 600;
          ">
            ${escapeHtml(
              time
            )}
          </td>
        </tr>
      `
      : "",

    place
      ? `
        <tr>
          <td style="
            padding: 7px 0;
            color: #71869A;
          ">
            Venue
          </td>

          <td style="
            padding: 7px 0;
            text-align: right;
            color: #F6F8FB;
            font-weight: 600;
          ">
            ${escapeHtml(
              place
            )}
          </td>
        </tr>
      `
      : "",

    address
      ? `
        <tr>
          <td style="
            padding: 7px 0;
            color: #71869A;
          ">
            Address
          </td>

          <td style="
            padding: 7px 0;
            text-align: right;
            color: #F6F8FB;
            font-weight: 600;
          ">
            ${escapeHtml(
              address
            )}
          </td>
        </tr>
      `
      : "",
  ]
    .filter(Boolean)
    .join("");
}

function getResendConfig() {
  const apiKey =
    process.env
      .RESEND_API_KEY;

  const from =
    process.env
      .RESEND_FROM_EMAIL;

  if (
    !apiKey ||
    !from
  ) {
    console.warn(
      "Resend email skipped: missing RESEND_API_KEY or RESEND_FROM_EMAIL."
    );

    return null;
  }

  return {
    resend:
      new Resend(
        apiKey
      ),

    from,
  };
}

export async function sendEventRegistrationEmail({
  registrationId,
  ticketCode,
  status,
  firstName,
  email,
  eventTitle,
  date,
  time,
  venue,
  location,
  address,
  waitlistPosition,
}: SendEventRegistrationEmailProps) {
  const resendConfig =
    getResendConfig();

  if (!resendConfig) {
    return {
      sent: false as const,

      reason:
        "not-configured" as const,
    };
  }

  const {
    resend,
    from,
  } = resendConfig;

  const confirmed =
    status ===
    "confirmed";

  const safeFirstName =
    escapeHtml(
      firstName
    );

  const safeTitle =
    escapeHtml(
      eventTitle
    );

  const formattedDate =
    formatEventDate(
      date
    );

  const place =
    venue ??
    location;

  const eventInfo =
    createEventInfoHtml({
      date,
      time,
      venue,
      location,
      address,
    });

  const cancellationUrl =
    createCancellationUrl(
      registrationId,
      ticketCode
    );

  let qrBase64:
    | string
    | undefined;

  if (confirmed) {
    try {
      qrBase64 =
        await createTicketQr(
          ticketCode
        );
    } catch (error) {
      console.error(
        "QR generation failed:",
        error
      );
    }
  }

  const subject =
    confirmed
      ? `You're registered for ${eventTitle}`
      : `You're on the waitlist for ${eventTitle}`;

  const statusTitle =
    confirmed
      ? "Your registration is confirmed."
      : "You're on the waitlist.";

  const intro =
    confirmed
      ? `Your place for ${safeTitle} has been reserved.`
      : `The event is currently full, but we've added you to the waitlist.`;

  const waitlistHtml =
    !confirmed &&
    waitlistPosition
      ? `
        <div style="
          margin-top: 24px;
          padding: 18px;
          background: #0D1D2C;
          border-radius: 12px;
        ">
          <div style="
            color: #8EA0B3;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          ">
            Waitlist position
          </div>

          <div style="
            margin-top: 6px;
            color: #F6F8FB;
            font-size: 24px;
            font-weight: 700;
          ">
            #${waitlistPosition}
          </div>
        </div>
      `
      : "";

  const ticketHtml =
    confirmed
      ? `
        <div style="
          margin-top: 28px;
          padding: 24px;
          background: #071422;
          border: 1px solid #1B3045;
          border-radius: 16px;
          text-align: center;
        ">
          <div style="
            color: #8EC5FF;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          ">
            Your ticket
          </div>

          ${
            qrBase64
              ? `
                <div style="
                  margin-top: 18px;
                ">
                  <img
                    src="cid:bba-event-ticket-qr"
                    width="220"
                    height="220"
                    alt="BBA Club event ticket QR code"
                    style="
                      display: inline-block;
                      width: 220px;
                      height: 220px;
                      max-width: 100%;
                      background: #FFFFFF;
                      border-radius: 12px;
                    "
                  />
                </div>
              `
              : `
                <div style="
                  margin-top: 18px;
                  padding: 18px;
                  color: #71869A;
                  font-size: 12px;
                  line-height: 1.6;
                  border: 1px solid #1B3045;
                  border-radius: 12px;
                ">
                  QR ticket could not be generated.
                  Please use the ticket code below.
                </div>
              `
          }

          <div style="
            margin-top: 18px;
            color: #71869A;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          ">
            Ticket code
          </div>

          <div style="
            margin-top: 7px;
            color: #A9B5C3;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
          ">
            ${escapeHtml(
              ticketCode
            )}
          </div>

          <div style="
            margin-top: 16px;
            color: #71869A;
            font-size: 12px;
            line-height: 1.6;
          ">
            Show this QR code at the entrance.
            A BBA Club organizer will scan it
            to check you in.
          </div>
        </div>
      `
      : "";

  const cancellationHtml =
    cancellationUrl
      ? `
        <div style="
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid #1B3045;
          text-align: center;
        ">
          <p style="
            margin: 0 0 14px;
            color: #71869A;
            font-size: 12px;
            line-height: 1.6;
          ">
            ${
              confirmed
                ? "Can't make it? Please release your spot so somebody else can join."
                : "No longer interested? You can remove yourself from the waitlist."
            }
          </p>

          <a
            href="${escapeHtml(
              cancellationUrl
            )}"
            style="
              display: inline-block;
              color: #A9B5C3;
              font-size: 12px;
              text-decoration: underline;
            "
          >
            ${
              confirmed
                ? "Cancel my registration"
                : "Leave the waitlist"
            }
          </a>
        </div>
      `
      : "";

  const html = `
    <!doctype html>

    <html>
      <head>
        <meta
          charset="UTF-8"
        />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background: #071422;
        font-family:
          Arial,
          Helvetica,
          sans-serif;
      ">
        <div style="
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        ">
          <div style="
            margin-bottom: 28px;
            color: #F6F8FB;
            font-size: 20px;
            font-weight: 700;
          ">
            BBA Club
          </div>

          <div style="
            padding: 32px;
            background: #0B1A29;
            border: 1px solid #1B3045;
            border-radius: 20px;
          ">
            <div style="
              color: #8EC5FF;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.12em;
            ">
              ${
                confirmed
                  ? "Registration confirmed"
                  : "Waitlist"
              }
            </div>

            <h1 style="
              margin: 14px 0 0;
              color: #F6F8FB;
              font-size: 28px;
              line-height: 1.2;
            ">
              ${statusTitle}
            </h1>

            <p style="
              margin: 18px 0 0;
              color: #A9B5C3;
              font-size: 15px;
              line-height: 1.7;
            ">
              Hi ${safeFirstName},
            </p>

            <p style="
              margin: 8px 0 0;
              color: #A9B5C3;
              font-size: 15px;
              line-height: 1.7;
            ">
              ${intro}
            </p>

            <div style="
              margin-top: 26px;
              padding-top: 22px;
              border-top: 1px solid #1B3045;
            ">
              <div style="
                margin-bottom: 12px;
                color: #F6F8FB;
                font-size: 18px;
                font-weight: 700;
              ">
                ${safeTitle}
              </div>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  font-size: 14px;
                "
              >
                ${eventInfo}
              </table>
            </div>

            ${waitlistHtml}

            ${ticketHtml}

            ${cancellationHtml}

            <p style="
              margin: 26px 0 0;
              color: #71869A;
              font-size: 12px;
              line-height: 1.6;
            ">
              Event details may change.
              Check the BBA Club website
              before the event for the
              latest information.
            </p>
          </div>

          <p style="
            margin: 24px 0 0;
            color: #53687D;
            font-size: 11px;
            text-align: center;
          ">
            BBA Club · Prague
          </p>
        </div>
      </body>
    </html>
  `;

  const text =
    confirmed
      ? `
Hi ${firstName},

Your registration for ${eventTitle} is confirmed.

${formattedDate ? `Date: ${formattedDate}\n` : ""}${time ? `Time: ${time}\n` : ""}${place ? `Venue: ${place}\n` : ""}${address ? `Address: ${address}\n` : ""}

Ticket code:
${ticketCode}

Show your QR ticket from this email at the entrance.

${
  cancellationUrl
    ? `Cancel your registration:\n${cancellationUrl}\n`
    : ""
}

BBA Club
      `.trim()
      : `
Hi ${firstName},

You're on the waitlist for ${eventTitle}.

${
  waitlistPosition
    ? `Waitlist position: #${waitlistPosition}\n`
    : ""
}

We'll let you know if a spot becomes available.

${
  cancellationUrl
    ? `Leave the waitlist:\n${cancellationUrl}\n`
    : ""
}

BBA Club
      `.trim();

  const attachments =
    confirmed &&
    qrBase64
      ? [
          {
            filename:
              "bba-club-ticket.png",

            content:
              qrBase64,

            contentType:
              "image/png",

            contentId:
              "bba-event-ticket-qr",
          },
        ]
      : undefined;

  const {
    data,
    error,
  } =
    await resend.emails.send(
      {
        from,

        to:
          email,

        subject,

        html,

        text,

        attachments,
      },
      {
        idempotencyKey:
          `event-registration/${registrationId}/${status}/${ticketCode}`,
      }
    );

  if (error) {
    console.error(
      "Resend error:",
      error
    );

    return {
      sent: false as const,

      reason:
        "provider-error" as const,

      error,
    };
  }

  return {
    sent: true as const,

    emailId:
      data?.id,
  };
}

/*
  PAYMENT REQUEST

  Used when somebody was on the
  waitlist for a paid event and
  a seat becomes available.

  No ticket is issued here.
  The ticket is created only after
  Comgate confirms payment.
*/

export async function sendEventPaymentRequestEmail({
  registrationId,
  ticketCode,
  paymentTransactionId,
  paymentUrl,
  reservationExpiresAt,
  amountCzk,
  firstName,
  email,
  eventTitle,
  date,
  time,
  venue,
  location,
  address,
}: SendEventPaymentRequestEmailProps) {
  const resendConfig =
    getResendConfig();

  if (!resendConfig) {
    return {
      sent: false as const,

      reason:
        "not-configured" as const,
    };
  }

  const {
    resend,
    from,
  } = resendConfig;

  const safeFirstName =
    escapeHtml(
      firstName
    );

  const safeTitle =
    escapeHtml(
      eventTitle
    );

  const safePaymentUrl =
    escapeHtml(
      paymentUrl
    );

  const formattedDate =
    formatEventDate(
      date
    );

  const formattedDeadline =
    formatPaymentDeadline(
      reservationExpiresAt
    );

  const formattedPrice =
    formatPrice(
      amountCzk
    );

  const place =
    venue ??
    location;

  const eventInfo =
    createEventInfoHtml({
      date,
      time,
      venue,
      location,
      address,
    });

  const cancellationUrl =
    ticketCode
      ? createCancellationUrl(
          registrationId,
          ticketCode
        )
      : undefined;

  const cancellationHtml =
    cancellationUrl
      ? `
        <div style="
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid #1B3045;
          text-align: center;
        ">
          <p style="
            margin: 0 0 14px;
            color: #71869A;
            font-size: 12px;
            line-height: 1.6;
          ">
            No longer interested?
            Please release the spot
            so we can offer it to
            somebody else.
          </p>

          <a
            href="${escapeHtml(
              cancellationUrl
            )}"
            style="
              display: inline-block;
              color: #A9B5C3;
              font-size: 12px;
              text-decoration: underline;
            "
          >
            Release my spot
          </a>
        </div>
      `
      : "";

  const html = `
    <!doctype html>

    <html>
      <head>
        <meta
          charset="UTF-8"
        />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background: #071422;
        font-family:
          Arial,
          Helvetica,
          sans-serif;
      ">
        <div style="
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        ">
          <div style="
            margin-bottom: 28px;
            color: #F6F8FB;
            font-size: 20px;
            font-weight: 700;
          ">
            BBA Club
          </div>

          <div style="
            padding: 32px;
            background: #0B1A29;
            border: 1px solid #1B3045;
            border-radius: 20px;
          ">
            <div style="
              color: #8EC5FF;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.12em;
            ">
              A spot is available
            </div>

            <h1 style="
              margin: 14px 0 0;
              color: #F6F8FB;
              font-size: 28px;
              line-height: 1.2;
            ">
              Complete your registration.
            </h1>

            <p style="
              margin: 18px 0 0;
              color: #A9B5C3;
              font-size: 15px;
              line-height: 1.7;
            ">
              Hi ${safeFirstName},
            </p>

            <p style="
              margin: 8px 0 0;
              color: #A9B5C3;
              font-size: 15px;
              line-height: 1.7;
            ">
              A spot has opened up for
              ${safeTitle}.
              Complete the payment to
              confirm your place.
            </p>

            <div style="
              margin-top: 26px;
              padding-top: 22px;
              border-top: 1px solid #1B3045;
            ">
              <div style="
                margin-bottom: 12px;
                color: #F6F8FB;
                font-size: 18px;
                font-weight: 700;
              ">
                ${safeTitle}
              </div>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  font-size: 14px;
                "
              >
                ${eventInfo}

                <tr>
                  <td style="
                    padding: 7px 0;
                    color: #71869A;
                  ">
                    Price
                  </td>

                  <td style="
                    padding: 7px 0;
                    text-align: right;
                    color: #F6F8FB;
                    font-weight: 600;
                  ">
                    ${escapeHtml(
                      formattedPrice
                    )}
                  </td>
                </tr>
              </table>
            </div>

            <div style="
              margin-top: 26px;
              padding: 22px;
              background: #071422;
              border: 1px solid #1B3045;
              border-radius: 16px;
              text-align: center;
            ">
              <div style="
                color: #8EC5FF;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.12em;
              ">
                Your spot is temporarily reserved
              </div>

              <p style="
                margin: 10px 0 0;
                color: #A9B5C3;
                font-size: 14px;
                line-height: 1.6;
              ">
                ${
                  formattedDeadline
                    ? `Complete payment by ${escapeHtml(
                        formattedDeadline
                      )}.`
                    : "Complete payment within 30 minutes."
                }
              </p>

              <a
                href="${safePaymentUrl}"
                style="
                  display: inline-block;
                  margin-top: 20px;
                  padding: 14px 24px;
                  background: #0057FF;
                  color: #FFFFFF;
                  font-size: 14px;
                  font-weight: 700;
                  text-decoration: none;
                  border-radius: 10px;
                "
              >
                Complete payment
              </a>

              <p style="
                margin: 16px 0 0;
                color: #53687D;
                font-size: 11px;
                line-height: 1.6;
              ">
                Your ticket will be issued
                only after the payment has
                been confirmed.
              </p>
            </div>

            ${cancellationHtml}

            <p style="
              margin: 26px 0 0;
              color: #71869A;
              font-size: 12px;
              line-height: 1.6;
            ">
              If payment is not completed
              before the reservation expires,
              the spot may be offered to the
              next person on the waitlist.
            </p>
          </div>

          <p style="
            margin: 24px 0 0;
            color: #53687D;
            font-size: 11px;
            text-align: center;
          ">
            BBA Club · Prague
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName},

A spot has opened up for ${eventTitle}.

Complete the payment to confirm your place.

${formattedDate ? `Date: ${formattedDate}\n` : ""}${time ? `Time: ${time}\n` : ""}${place ? `Venue: ${place}\n` : ""}${address ? `Address: ${address}\n` : ""}Price: ${formattedPrice}

${
  formattedDeadline
    ? `Complete payment by: ${formattedDeadline}`
    : "Complete payment within 30 minutes."
}

Payment:
${paymentUrl}

Your ticket will be issued only after the payment has been confirmed.

${
  cancellationUrl
    ? `No longer interested? Release your spot:\n${cancellationUrl}\n`
    : ""
}

BBA Club
  `.trim();

  const {
    data,
    error,
  } =
    await resend.emails.send(
      {
        from,

        to:
          email,

        subject:
          `A spot is available for ${eventTitle}`,

        html,

        text,
      },
      {
        idempotencyKey:
          `event-payment-request/${registrationId}/${paymentTransactionId}`,
      }
    );

  if (error) {
    console.error(
      "Payment request email error:",
      error
    );

    return {
      sent: false as const,

      reason:
        "provider-error" as const,

      error,
    };
  }

  return {
    sent: true as const,

    emailId:
      data?.id,
  };
}