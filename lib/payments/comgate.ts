import "server-only";

export type ComgateCurrency =
  | "CZK"
  | "EUR";

type CreateComgatePaymentInput = {
  /*
    New generic interface.

    amountCzk is temporarily kept
    for backwards compatibility
    with the current registration
    API and can be removed once that
    endpoint is migrated.
  */

  amount?: number;

  amountCzk?: number;

  currency?: ComgateCurrency;

  refId: string;

  email: string;

  fullName: string;

  eventTitle: string;

  paidUrl: string;

  cancelledUrl: string;

  pendingUrl: string;
};

type RefundComgatePaymentInput = {
  transId: string;

  amount: number;

  currency: ComgateCurrency;

  refId?: string;
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

type ComgateRefundResponse = {
  code: number;

  message: string;
};

export type ComgatePaymentStatus =
  | "PENDING"
  | "PAID"
  | "CANCELLED"
  | "AUTHORIZED";

export type ComgateStatusResponse = {
  code: number;

  message: string;

  test?: string;

  price?:
    | string
    | number;

  curr?: string;

  label?: string;

  refId?: string;

  method?: string;

  account?: string;

  email?: string;

  name?: string;

  transId?: string;

  status?:
    ComgatePaymentStatus;

  paymentErrorReason?:
    string;
};

const COMGATE_API_URL =
  "https://payments.comgate.cz/v2.0";

function getCredentials() {
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

export function isComgateTestMode() {
  /*
    Fail safe.

    Unless production mode is
    explicitly enabled, every
    transaction is created as test.
  */

  return (
    process.env
      .COMGATE_TEST_MODE !==
    "false"
  );
}

function validCurrency(
  value: unknown
): value is ComgateCurrency {
  return (
    value === "CZK" ||
    value === "EUR"
  );
}

function toMinorUnits(
  amount: number,
  currency: ComgateCurrency
) {
  if (
    !Number.isFinite(
      amount
    ) ||
    amount <= 0
  ) {
    throw new Error(
      "Invalid payment amount."
    );
  }

  /*
    CZK and EUR both use two
    decimal places in Comgate.

    CZK:
      150 CZK -> 15000 haléřů

    EUR:
      10 EUR -> 1000 cents
  */

  const result =
    Math.round(
      amount * 100
    );

  /*
    Defensive currency reference.
    If more currencies are ever
    added, this function should be
    reviewed first.
  */

  if (
    currency !== "CZK" &&
    currency !== "EUR"
  ) {
    throw new Error(
      "Unsupported payment currency."
    );
  }

  return result;
}

function resolveCreateAmount(
  input:
    CreateComgatePaymentInput
) {
  /*
    New calls use amount +
    currency.

    Old calls still use amountCzk.
  */

  if (
    typeof input.amount ===
      "number"
  ) {
    return {
      amount:
        input.amount,

      currency:
        input.currency ??
        "CZK",
    };
  }

  if (
    typeof input.amountCzk ===
      "number"
  ) {
    return {
      amount:
        input.amountCzk,

      currency:
        "CZK" as const,
    };
  }

  throw new Error(
    "Missing payment amount."
  );
}

function getSettlementAccount(
  currency: ComgateCurrency
) {
  /*
    Optional Comgate bank account
    identifier.

    These are NOT normal bank
    account numbers.

    If omitted, Comgate uses the
    default account configured for
    the shop.
  */

  const value =
    currency === "EUR"
      ? process.env
          .COMGATE_ACCOUNT_EUR
          ?.trim()
      : process.env
          .COMGATE_ACCOUNT_CZK
          ?.trim();

  return value || undefined;
}

export async function createComgatePayment(
  input:
    CreateComgatePaymentInput
) {
  const {
    amount,
    currency,
  } =
    resolveCreateAmount(
      input
    );

  if (
    !validCurrency(
      currency
    )
  ) {
    throw new Error(
      "Unsupported payment currency."
    );
  }

  const account =
    getSettlementAccount(
      currency
    );

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
              isComgateTestMode(),

            price:
              toMinorUnits(
                amount,
                currency
              ),

            curr:
              currency,

            label:
              "BBA Club ticket",

            refId:
              input.refId,

            method:
              "ALL",

            ...(account
              ? {
                  account,
                }
              : {}),

            email:
              input.email,

            fullName:
              input.fullName,

            category:
              "OTHER",

            name:
              input.eventTitle,

            lang:
              "en",

            expirationTime:
              "30m",

            /*
              Comgate only displays
              methods enabled for the
              merchant account.
            */

            enableApplePayGooglePay:
              true,

            url_paid:
              input.paidUrl,

            url_cancelled:
              input.cancelledUrl,

            url_pending:
              input.pendingUrl,
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

        currency,

        amount,
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

    amount,

    currency,
  };
}

export async function getComgatePaymentStatus(
  transId: string
) {
  const normalizedTransId =
    transId.trim();

  if (
    !normalizedTransId
  ) {
    throw new Error(
      "Missing Comgate transaction ID."
    );
  }

  const response =
    await fetch(
      `${COMGATE_API_URL}/payment/transId/${encodeURIComponent(
        normalizedTransId
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

        transId:
          normalizedTransId,
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

  A payment can only be cancelled
  while Comgate still reports it
  as PENDING.

  After the DELETE request we
  verify the authoritative state
  again.
*/

export async function cancelComgatePayment(
  transId: string
) {
  const normalizedTransId =
    transId.trim();

  if (
    !normalizedTransId
  ) {
    throw new Error(
      "Missing Comgate transaction ID."
    );
  }

  const response =
    await fetch(
      `${COMGATE_API_URL}/payment/transId/${encodeURIComponent(
        normalizedTransId
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
    HTTP 204 contains no body.

    Code 1400 commonly means that
    the transaction can no longer
    be changed to CANCELLED, for
    example because it has already
    become PAID.

    In that situation the status
    check below decides the result.
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

          transId:
            normalizedTransId,
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

          transId:
            normalizedTransId,
        }
      );

      throw new Error(
        "Could not cancel the payment."
      );
    }
  }

  const payment =
    await getComgatePaymentStatus(
      normalizedTransId
    );

  return {
    cancelled:
      payment.status ===
      "CANCELLED",

    status:
      payment.status,
  };
}

/*
  REFUND PAID PAYMENT

  Supports both full and partial
  refunds.

  This is important for BBA Club
  because a refund may be lower
  than the original ticket price.
*/

export async function refundComgatePayment({
  transId,
  amount,
  currency,
  refId,
}: RefundComgatePaymentInput) {
  const normalizedTransId =
    transId.trim();

  if (
    !normalizedTransId
  ) {
    throw new Error(
      "Missing Comgate transaction ID."
    );
  }

  if (
    !validCurrency(
      currency
    )
  ) {
    throw new Error(
      "Unsupported refund currency."
    );
  }

  const response =
    await fetch(
      `${COMGATE_API_URL}/refund.json`,
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
            transId:
              normalizedTransId,

            amount:
              toMinorUnits(
                amount,
                currency
              ),

            test:
              isComgateTestMode(),

            ...(refId
              ? {
                  refId,
                }
              : {}),
          }),

        cache:
          "no-store",
      }
    );

  /*
    Comgate may acknowledge the
    refund with HTTP 204 and no
    response body.
  */

  if (
    response.status ===
    204
  ) {
    return {
      refunded:
        true,

      amount,

      currency,
    };
  }

  let data:
    ComgateRefundResponse;

  try {
    data =
      (await response.json()) as
        ComgateRefundResponse;
  } catch {
    throw new Error(
      "Comgate returned an invalid refund response."
    );
  }

  if (
    !response.ok ||
    data.code !== 0
  ) {
    console.error(
      "Comgate refund failed:",
      {
        httpStatus:
          response.status,

        code:
          data.code,

        message:
          data.message,

        transId:
          normalizedTransId,

        amount,

        currency,
      }
    );

    throw new Error(
      "Could not refund the payment."
    );
  }

  return {
    refunded:
      true,

    amount,

    currency,

    code:
      data.code,

    message:
      data.message,
  };
}
