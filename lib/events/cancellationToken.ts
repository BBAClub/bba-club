import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

function getSecret() {
  const secret =
    process.env
      .CANCELLATION_SECRET
      ?.trim();

  if (!secret) {
    throw new Error(
      "Missing CANCELLATION_SECRET."
    );
  }

  return secret;
}

function getPayload(
  registrationId: string,
  ticketCode: string
) {
  return [
    "bba-registration-cancellation",
    registrationId,
    ticketCode,
  ].join(":");
}

export function createCancellationToken(
  registrationId: string,
  ticketCode: string
) {
  return createHmac(
    "sha256",
    getSecret()
  )
    .update(
      getPayload(
        registrationId,
        ticketCode
      )
    )
    .digest("hex");
}

export function verifyCancellationToken(
  registrationId: string,
  ticketCode: string,
  suppliedToken: string
) {
  if (!suppliedToken) {
    return false;
  }

  const expectedToken =
    createCancellationToken(
      registrationId,
      ticketCode
    );

  const supplied =
    Buffer.from(
      suppliedToken
    );

  const expected =
    Buffer.from(
      expectedToken
    );

  if (
    supplied.length !==
    expected.length
  ) {
    return false;
  }

  return timingSafeEqual(
    supplied,
    expected
  );
}