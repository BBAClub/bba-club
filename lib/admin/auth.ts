import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  cookies,
} from "next/headers";

const COOKIE_NAME =
  "bba_admin_session";

const SESSION_DURATION_SECONDS =
  60 * 60 * 12;

function getAdminPassword() {
  const password =
    process.env
      .CHECKIN_ADMIN_SECRET
      ?.trim();

  if (!password) {
    throw new Error(
      "Missing CHECKIN_ADMIN_SECRET."
    );
  }

  return password;
}

function getSessionSecret() {
  const secret =
    process.env
      .ADMIN_SESSION_SECRET
      ?.trim();

  if (!secret) {
    throw new Error(
      "Missing ADMIN_SESSION_SECRET."
    );
  }

  return secret;
}

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

export function verifyAdminPassword(
  suppliedPassword: string
) {
  if (
    !suppliedPassword
  ) {
    return false;
  }

  const expectedPassword =
    getAdminPassword();

  return safeEqual(
    suppliedPassword,
    expectedPassword
  );
}

function signExpiry(
  expiresAt: number
) {
  return createHmac(
    "sha256",
    getSessionSecret()
  )
    .update(
      `bba-admin-session:${expiresAt}`
    )
    .digest("hex");
}

function createSessionToken() {
  const expiresAt =
    Math.floor(
      Date.now() / 1000
    ) +
    SESSION_DURATION_SECONDS;

  const signature =
    signExpiry(
      expiresAt
    );

  return {
    token:
      `${expiresAt}.${signature}`,

    expiresAt,
  };
}

function verifySessionToken(
  token?: string
) {
  if (!token) {
    return false;
  }

  const parts =
    token.split(".");

  if (
    parts.length !== 2
  ) {
    return false;
  }

  const [
    expiresAtRaw,
    suppliedSignature,
  ] = parts;

  const expiresAt =
    Number(
      expiresAtRaw
    );

  if (
    !Number.isFinite(
      expiresAt
    )
  ) {
    return false;
  }

  const now =
    Math.floor(
      Date.now() / 1000
    );

  if (
    expiresAt <= now
  ) {
    return false;
  }

  const expectedSignature =
    signExpiry(
      expiresAt
    );

  return safeEqual(
    suppliedSignature,
    expectedSignature
  );
}

export async function createAdminSession() {
  const {
    token,
  } =
    createSessionToken();

  const cookieStore =
    await cookies();

  cookieStore.set(
    COOKIE_NAME,
    token,
    {
      httpOnly: true,

      secure:
        process.env
          .NODE_ENV ===
        "production",

      sameSite:
        "lax",

      path: "/",

      maxAge:
        SESSION_DURATION_SECONDS,
    }
  );
}

export async function clearAdminSession() {
  const cookieStore =
    await cookies();

  cookieStore.set(
    COOKIE_NAME,
    "",
    {
      httpOnly: true,

      secure:
        process.env
          .NODE_ENV ===
        "production",

      sameSite:
        "lax",

      path: "/",

      maxAge: 0,
    }
  );
}

export async function isAdminAuthenticated() {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        COOKIE_NAME
      )?.value;

    return verifySessionToken(
      token
    );
  } catch (
    error
  ) {
    console.error(
      "Admin session verification error:",
      error
    );

    return false;
  }
}