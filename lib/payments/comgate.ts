import "server-only";

type CreateComgatePaymentInput = {
  amountCzk: number;

  refId: string;

  email: string;

  fullName: string;

  eventTitle: string;

  paidUrl: string;

  cancelledUrl: string;

  pendingUrl: string;
};

type ComgateCreateResponse = {
  code: number;

  message: string;

  transId?: string;

  redirect?: string;
};

type ComgateCancelResponse = {
  code: number;

  message: string;
};

export type ComgatePaymentStatus =
  | "PENDING"
  | "PAID"
  | "CANCELLED"
  | "AUTHORIZED";

type ComgateStatusResponse = {
  code: number;

  message: string;

  test?: string;

  price?: string;

  curr?: string;

  label?: string;

  refId?: string;

  email?: string;

  name?: string;

  transId?: string;

  status?: ComgatePaymentStatus;
};

const COMGATE_API_URL =
  "https://payments.comgate.cz/v2.0";

function getCredentials() {
  const merchant =
    process.env.COMGATE_MERCHANT;

  const secret =
    process.env.COMGATE_SECRET;

  if (
    !merchant ||
    !secret
  ) {
    throw new Error(
      "Comgate credentials are not configured."
    );
  }

  return {
    merchant,
    secret,
  };
}

function getAuthorizationHeader() {
  const {
    merchant,
    secret,
  } = getCredentials();

  const encoded =
    Buffer.from(
      `${merchant}:${secret}`
    ).toString(
      "base64"
    );

  return `Basic ${encoded}`;
}

function isTestMode() {
  /*
    Unless explicitly set to false,
    keep Comgate in test mode.
  */

  return (
    process.env
      .COMGATE_TEST_MODE !==
    "false"
  );
}

function toHalere(
  amountCzk: number
) {
  if (
    !Number.isFinite(
      amountCzk
    ) ||
    amountCzk <= 0
  ) {
    throw new Error(
      "Invalid payment amount."
    );
  }

  return Math.round(
    amountCzk * 100
  );
}

export async function createComgatePayment({
  amountCzk,
  refId,
  email,
  fullName,
  eventTitle,
  paidUrl,
  cancelledUrl,
  pendingUrl,
}: CreateComgatePaymentInput) {
  const response =
    await fetch(
      `${COMGATE_API_URL}/payment.json`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            getAuthorizationHeader(),

          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify({
            test:
              isTestMode(),

            price:
              toHalere(
                amountCzk
              ),

            curr:
              "CZK",

            label:
              "BBA Club ticket",

            refId,

            method:
              "ALL",

            email,

            fullName,

            category:
              "OTHER",

            name:
              eventTitle,

            lang:
              "en",

            expirationTime:
              "30m",

            /*
              Explicitly allow Apple Pay
              and Google Pay for this
              payment when enabled on
              the Comgate account.
            */
            enableApplePayGooglePay:
              true,

            url_paid:
              paidUrl,

            url_cancelled:
              cancelledUrl,

            url_pending:
              pendingUrl,
          }),
      }
    );

  let data:
    ComgateCreateResponse;

  try {
    data =
      (await response.json()) as
        ComgateCreateResponse;
  } catch {
    throw new Error(
      "Comgate returned an invalid response."
    );
  }

  if (
    !response.ok ||
    data.code !== 0 ||
    !data.transId ||
    !data.redirect
  ) {
    console.error(
      "Comgate create payment failed:",
      {
        httpStatus:
          response.status,

        code:
          data.code,

        message:
          data.message,
      }
    );

    throw new Error(
      "Could not create the payment."
    );
  }

  return {
    transId:
      data.transId,

    redirectUrl:
      data.redirect,
  };
}

export async function getComgatePaymentStatus(
  transId: string
) {
  if (!transId) {
    throw new Error(
      "Missing Comgate transaction ID."
    );
  }

  const response =
    await fetch(
      `${COMGATE_API_URL}/payment/transId/${encodeURIComponent(
        transId
      )}.json`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            getAuthorizationHeader(),

          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );

  let data:
    ComgateStatusResponse;

  try {
    data =
      (await response.json()) as
        ComgateStatusResponse;
  } catch {
    throw new Error(
      "Comgate returned an invalid status response."
    );
  }

  if (
    !response.ok ||
    data.code !== 0 ||
    !data.status
  ) {
    console.error(
      "Comgate payment status failed:",
      {
        httpStatus:
          response.status,

        code:
          data.code,

        message:
          data.message,

        transId,
      }
    );

    throw new Error(
      "Could not verify the payment."
    );
  }

  return data;
}

/*
  CANCEL PENDING PAYMENT

  Comgate only allows cancellation
  while the payment is still PENDING.

  After attempting the DELETE we
  always verify the real state again.
*/

export async function cancelComgatePayment(
  transId: string
) {
  if (!transId) {
    throw new Error(
      "Missing Comgate transaction ID."
    );
  }

  const response =
    await fetch(
      `${COMGATE_API_URL}/payment/transId/${encodeURIComponent(
        transId
      )}.json`,
      {
        method:
          "DELETE",

        headers: {
          Authorization:
            getAuthorizationHeader(),

          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );

  /*
    204 means the request was accepted
    but Comgate returned no response
    body.

    For a normal response, code 0 is
    success.

    Code 1400 means the payment could
    not be switched to CANCELLED,
    usually because it is no longer
    PENDING. In that case we verify
    its current status below.
  */

  if (
    response.status !==
    204
  ) {
    let data:
      ComgateCancelResponse;

    try {
      data =
        (await response.json()) as
          ComgateCancelResponse;
    } catch {
      throw new Error(
        "Comgate returned an invalid cancellation response."
      );
    }

    if (
      !response.ok
    ) {
      console.error(
        "Comgate payment cancellation failed:",
        {
          httpStatus:
            response.status,

          code:
            data.code,

          message:
            data.message,

          transId,
        }
      );

      throw new Error(
        "Could not cancel the payment."
      );
    }

    if (
      data.code !== 0 &&
      data.code !== 1400
    ) {
      console.error(
        "Comgate payment cancellation failed:",
        {
          httpStatus:
            response.status,

          code:
            data.code,

          message:
            data.message,

          transId,
        }
      );

      throw new Error(
        "Could not cancel the payment."
      );
    }
  }

  /*
    Verify the authoritative state
    after the cancellation attempt.
  */

  const payment =
    await getComgatePaymentStatus(
      transId
    );

  return {
    cancelled:
      payment.status ===
      "CANCELLED",

    status:
      payment.status,
  };
}