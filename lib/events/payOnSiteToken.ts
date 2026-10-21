import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

function getSecret() {
  const secret =
    process.env.CANCELLATION_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "Missing CANCELLATION_SECRET."
    );
  }

  return secret;
}

function getPayload(
  registrationId: string,
  paymentTransactionId: string,
  expiresAt: string
) {
  return [
    "bba-pay-on-site-fallback",
    registrationId,
    paymentTransactionId,
    expiresAt,
  ].join(":");
}

export function createPayOnSiteToken(
  registrationId: string,
  paymentTransactionId: string,
  expiresAt: string
) {
  return createHmac(
    "sha256",
    getSecret()
  )
    .update(
      getPayload(
        registrationId,
        paymentTransactionId,
        expiresAt
      )
    )
    .digest("hex");
}

export function verifyPayOnSiteToken(
  registrationId: string,
  paymentTransactionId: string,
  expiresAt: string,
  suppliedToken: string
) {
  const expires =
    new Date(expiresAt);

  if (
    !suppliedToken ||
    Number.isNaN(expires.getTime()) ||
    expires.getTime() < Date.now()
  ) {
    return false;
  }

  const expectedToken =
    createPayOnSiteToken(
      registrationId,
      paymentTransactionId,
      expiresAt
    );

  const supplied =
    Buffer.from(suppliedToken);

  const expected =
    Buffer.from(expectedToken);

  if (
    supplied.length !== expected.length
  ) {
    return false;
  }

  return timingSafeEqual(
    supplied,
    expected
  );
}
