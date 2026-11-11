import "server-only";
import { cookies } from "next/headers";
import { randomBytes, randomInt } from "node:crypto";
import { Resend } from "resend";
import { client } from "@/sanity/lib/client";
import { digest, safeEqual, schoolEmail, seal, unseal } from "./security";
import { hashPassword, validPassword, verifyPassword } from "./passwords";
import type { AdminAccount } from "./permissions";

export const ACCOUNT_COOKIE = "bba_admin_account";
const CHALLENGE_COOKIE = "bba_admin_challenge";
const SESSION_SECONDS = 60 * 60 * 12;
const CODE_SECONDS = 60 * 10;
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
type EncryptedDocument = { _id: string; _rev: string; payload: string };
type Challenge = {
  email: string;
  name: string;
  browserHash: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  consumed: boolean;
};
type Session = {
  id: string;
  version: number;
  expiresAt: number;
  nonce: string;
};
export class AccountError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function accountsEnabled() {
  return process.env.ADMIN_ACCOUNTS_ENABLED === "true";
}
export function bootstrapEmail() {
  return schoolEmail(process.env.ADMIN_BOOTSTRAP_EMAIL);
}
function db() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error("Missing SANITY_API_WRITE_TOKEN.");
  return client.withConfig({ token, useCdn: false, perspective: "raw" });
}
function accountId(email: string) {
  return `adminAccounts.${digest("account-id", email)}`;
}
type StoredAccount = AdminAccount & { passwordHash?: string };
function decodeStored(doc: EncryptedDocument) {
  const account = unseal<StoredAccount>(doc._id, doc.payload);
  if (account.id !== doc._id || !schoolEmail(account.email))
    throw new Error("Invalid account record.");
  return account;
}
function publicAccount(stored: StoredAccount): AdminAccount {
  const { passwordHash: _secret, ...account } = stored;
  void _secret;
  return account;
}
function decode(doc: EncryptedDocument) {
  return publicAccount(decodeStored(doc));
}
export async function readAccount(id: string) {
  if (!/^adminAccounts\.[a-f0-9]{64}$/.test(id)) return null;
  const doc = await db().getDocument<EncryptedDocument>(id);
  return doc ? decode(doc) : null;
}
export async function currentAccount() {
  if (!accountsEnabled()) return null;
  const value = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  if (!value || value.length > 2048) return null;
  let session: Session;
  try {
    session = unseal<Session>("admin-session-v2", value);
  } catch {
    return null;
  }
  if (!Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now())
    return null;
  // Direct Doc API: no CDN or eventually-consistent query for access revocation.
  const account = await readAccount(session.id);
  return account && account.sessionVersion === session.version ? account : null;
}
export async function issueSession(account: AdminAccount) {
  const session: Session = {
    id: account.id,
    version: account.sessionVersion,
    expiresAt: Date.now() + SESSION_SECONDS * 1000,
    nonce: randomBytes(16).toString("hex"),
  };
  (await cookies()).set(ACCOUNT_COOKIE, seal("admin-session-v2", session), {
    ...cookieOptions,
    maxAge: SESSION_SECONDS,
  });
}
export async function clearAccountSession() {
  const store = await cookies();
  for (const name of [ACCOUNT_COOKIE, CHALLENGE_COOKIE])
    store.set(name, "", { ...cookieOptions, maxAge: 0 });
}
// Fixed private IDs enforce unique identities and atomic rate buckets. These are
// authentication infrastructure, not ordinary CMS content. Never publish via Studio.
async function rateLimit(key: string, limit: number, windowMs: number) {
  const id = `adminRate.${digest("rate", key)}`;
  const now = Date.now();
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await db().createIfNotExists({
      _id: id,
      _type: "adminRate",
      count: 0,
      resetAt: now + windowMs,
    });
    const expired = doc.resetAt <= now;
    if (!expired && doc.count >= limit)
      throw new AccountError("Too many requests. Please try again later.", 429);
    try {
      await db()
        .patch(id)
        .ifRevisionId(doc._rev)
        .set({
          count: expired ? 1 : doc.count + 1,
          resetAt: expired ? now + windowMs : doc.resetAt,
        })
        .commit({ visibility: "sync" });
      return;
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode !== 409) throw error;
    }
  }
  throw new AccountError("Please try again in a moment.", 429);
}
export async function requestCode(emailValue: unknown, nameValue: unknown) {
  if (!accountsEnabled())
    throw new AccountError("Account sign-in is not enabled.", 404);
  const email = schoolEmail(emailValue);
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  if (!email)
    throw new AccountError("Use your school email ending in @vse.cz.");
  if (name.length < 2 || name.length > 100)
    throw new AccountError("Enter your name (2–100 characters).");
  if (!bootstrapEmail())
    throw new AccountError(
      "Account sign-in needs administrator configuration.",
      503,
    );
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
    throw new AccountError("Email sign-in is not configured.", 503);
  await rateLimit("email-global", 100, 60 * 60 * 1000);
  await rateLimit(`email-minute:${email}`, 1, 60 * 1000);
  await rateLimit(`email-hour:${email}`, 5, 60 * 60 * 1000);
  const nonce = randomBytes(32).toString("hex");
  const code = String(randomInt(0, 100000000)).padStart(8, "0");
  const id = `adminChallenges.${digest("challenge-id", email)}`;
  const challenge: Challenge = {
    email,
    name,
    browserHash: digest("browser", nonce),
    codeHash: digest("code", `${nonce}:${code}`),
    expiresAt: Date.now() + CODE_SECONDS * 1000,
    attempts: 0,
    consumed: false,
  };
  await db().createOrReplace(
    { _id: id, _type: "adminChallenge", payload: seal(id, challenge) },
    { visibility: "sync" },
  );
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "BBA Club admin — verification code",
    text: `Your BBA Club admin verification code is: ${code}\n\nEnter it in the same browser where you requested it. It expires in 10 minutes and works once. If you did not request this code, ignore this email. Never share this code with anyone.`,
  });
  if (error) {
    // Leave the per-address cooldown in place to prevent send-error abuse.
    throw new AccountError(
      "Could not send the code. Please try again later.",
      503,
    );
  }
  (await cookies()).set(
    CHALLENGE_COOKIE,
    seal("admin-challenge-cookie", { id, nonce }),
    { ...cookieOptions, maxAge: CODE_SECONDS },
  );
}
export async function verifyCode(codeValue: unknown, passwordValue: unknown) {
  if (!validPassword(passwordValue))
    throw new AccountError("Use a password of 12–128 characters.");
  if (!accountsEnabled())
    throw new AccountError("Account sign-in is not enabled.", 404);
  const code =
    typeof codeValue === "string" ? codeValue.replace(/\s/g, "") : "";
  if (!/^\d{8}$/.test(code))
    throw new AccountError("Enter the 8-digit code from your school email.");
  const cookie = (await cookies()).get(CHALLENGE_COOKIE)?.value;
  let binding: { id: string; nonce: string };
  try {
    binding = unseal("admin-challenge-cookie", cookie ?? "");
  } catch {
    throw new AccountError("Request a new code in this browser.");
  }
  const doc = await db().getDocument<EncryptedDocument>(binding.id);
  if (!doc) throw new AccountError("Request a new code.");
  const challenge = unseal<Challenge>(doc._id, doc.payload);
  if (
    challenge.consumed ||
    challenge.expiresAt <= Date.now() ||
    challenge.attempts >= 5 ||
    !safeEqual(challenge.browserHash, digest("browser", binding.nonce))
  )
    throw new AccountError("Code expired or unavailable. Request a new code.");
  const valid = safeEqual(
    challenge.codeHash,
    digest("code", `${binding.nonce}:${code}`),
  );
  challenge.attempts += 1;
  challenge.consumed = valid;
  try {
    await db()
      .patch(doc._id)
      .ifRevisionId(doc._rev)
      .set({ payload: seal(doc._id, challenge) })
      .commit({ visibility: "sync" });
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 409)
      throw new AccountError("Code already used or updated. Please try again.");
    throw error;
  }
  if (!valid) throw new AccountError("Incorrect verification code.");
  const id = accountId(challenge.email);
  const now = new Date().toISOString();
  const bootstrap = challenge.email === bootstrapEmail();
  const initial: AdminAccount = {
    id,
    email: challenge.email,
    name: challenge.name,
    status: bootstrap ? "active" : "pending",
    role: bootstrap ? "administrator" : "member",
    permissions: [],
    sessionVersion: 1,
    verifiedAt: now,
    updatedAt: now,
  };
  const existing = await db().getDocument<EncryptedDocument>(id);
  if (existing && decodeStored(existing).passwordHash)
    throw new AccountError(
      "This account already has a password. Sign in or use Forgot password.",
    );
  const document = await db().createIfNotExists(
    { _id: id, _type: "adminAccount", payload: seal(id, initial) },
    { visibility: "sync" },
  );
  const stored = decodeStored(document);
  if (stored.passwordHash)
    throw new AccountError(
      "This account already has a password. Use Forgot password.",
    );
  const updated: StoredAccount = {
    ...stored,
    passwordHash: await hashPassword(passwordValue),
    sessionVersion: stored.sessionVersion + 1,
  };
  try {
    await db()
      .patch(document._id)
      .ifRevisionId(document._rev)
      .set({ payload: seal(document._id, updated) })
      .commit({ visibility: "sync" });
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 409)
      throw new AccountError(
        "Account changed. Please sign in or request a new code.",
        409,
      );
    throw error;
  }
  const account = publicAccount(updated);
  await issueSession(account);
  (await cookies()).set(CHALLENGE_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return account;
}
export async function listAccounts() {
  const docs = await db().fetch<EncryptedDocument[]>(
    '*[_type == "adminAccount" && _id in path("adminAccounts.*")] | order(_createdAt desc)',
    {},
    { cache: "no-store" },
  );
  return docs.map(decode);
}
export async function updateAccount(
  actor: AdminAccount,
  input: {
    id: string;
    revision: number;
    status: AdminAccount["status"];
    role: AdminAccount["role"];
    permissions: AdminAccount["permissions"];
    teamMemberId?: string;
  },
) {
  if (actor.status !== "active" || actor.role !== "administrator")
    throw new AccountError("Access denied.", 403);
  const doc = await db().getDocument<EncryptedDocument>(input.id);
  if (!doc || doc._type !== "adminAccount")
    throw new AccountError("Account not found.", 404);
  const account = decodeStored(doc);
  const accessChanged =
    account.status !== input.status ||
    account.role !== input.role ||
    [...account.permissions].sort().join(",") !==
      [...input.permissions].sort().join(",");
  if (accessChanged && actor.id === input.id)
    throw new AccountError("You cannot change your own access.");
  if (accessChanged && account.email === bootstrapEmail())
    throw new AccountError(
      "The primary administrator is managed through server configuration.",
    );
  if (input.revision !== account.sessionVersion)
    throw new AccountError("This account changed. Refresh and try again.", 409);
  if (input.teamMemberId) {
    const member = await db().getDocument<{ _type: string }>(
      input.teamMemberId,
    );
    if (!member || member._type !== "teamMember")
      throw new AccountError("Team member not found.");
    const others = await listAccounts();
    if (
      others.some(
        (other) =>
          other.id !== input.id && other.teamMemberId === input.teamMemberId,
      )
    )
      throw new AccountError(
        "This team profile is already linked to another account.",
      );
  }
  const updated: StoredAccount = {
    ...account,
    status: input.status,
    role: input.role,
    permissions: input.permissions,
    teamMemberId: input.teamMemberId || undefined,
    sessionVersion: account.sessionVersion + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.id,
  };
  try {
    await db()
      .patch(doc._id)
      .ifRevisionId(doc._rev)
      .set({ payload: seal(doc._id, updated) })
      .commit({ visibility: "sync" });
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 409)
      throw new AccountError(
        "This account changed. Refresh and try again.",
        409,
      );
    throw error;
  }
  return publicAccount(updated);
}

export async function passwordSignIn(
  emailValue: unknown,
  passwordValue: unknown,
) {
  if (!accountsEnabled())
    throw new AccountError("Account sign-in is not enabled.", 404);
  const email = schoolEmail(emailValue);
  if (!email || typeof passwordValue !== "string" || passwordValue.length > 128)
    throw new AccountError("Incorrect email or password.", 401);
  await rateLimit(`password-login:${email}`, 10, 15 * 60 * 1000);
  await rateLimit("password-global", 100, 60 * 1000);
  const doc = await db().getDocument<EncryptedDocument>(accountId(email));
  const stored = doc ? decodeStored(doc) : null;
  const valid = await verifyPassword(passwordValue, stored?.passwordHash);
  if (!valid || !stored)
    throw new AccountError(
      "Incorrect email or password. If you have not set a password yet, use Forgot / set password.",
      401,
    );
  // Re-read after expensive hashing so a concurrent block/password change wins.
  const fresh = await readAccount(stored.id);
  if (!fresh || fresh.sessionVersion !== stored.sessionVersion)
    throw new AccountError("Account changed. Please try again.", 409);
  await issueSession(fresh);
  return fresh;
}

function resetOrigin() {
  // The link must open this environment, never derive it from an untrusted Host.
  const configured =
    process.env.ADMIN_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured)
    throw new AccountError("Password recovery is not configured.", 503);
  const url = new URL(configured);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new AccountError("Invalid sign-in URL configuration.", 503);
  return url.origin;
}
export async function requestPasswordReset(emailValue: unknown) {
  if (!accountsEnabled())
    throw new AccountError("Account sign-in is not enabled.", 404);
  const email = schoolEmail(emailValue);
  if (!email)
    throw new AccountError("Use your school email ending in @vse.cz.");
  const origin = resetOrigin();
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
    throw new AccountError("Email delivery is not configured.", 503);
  await rateLimit("email-global", 100, 60 * 60 * 1000);
  await rateLimit(`email-minute:${email}`, 1, 60 * 1000);
  await rateLimit(`email-hour:${email}`, 5, 60 * 60 * 1000);
  const account = await readAccount(accountId(email));
  if (!account) return; // Same success response for unknown addresses.
  const token = randomBytes(32).toString("hex");
  const id = `adminPasswordResets.${digest("reset-id", email)}`;
  const payload = {
    accountId: account.id,
    version: account.sessionVersion,
    tokenHash: digest("password-reset", token),
    expiresAt: Date.now() + 30 * 60 * 1000,
  };
  await db().createOrReplace(
    { _id: id, _type: "adminPasswordReset", payload: seal(id, payload) },
    { visibility: "sync" },
  );
  // Fragment keeps the secret out of server/proxy request URLs and referrers.
  const link = `${origin}/admin/reset-password#${id}:${token}`;
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "BBA Club admin — set or reset your password",
    text: `Set or reset your BBA Club admin password:\n${link}\n\nThis link expires in 30 minutes and works once. Opening it does not change your password. If you did not request it, ignore this email. Never share this link.`,
  });
  if (error)
    throw new AccountError(
      "Could not send the email. Please try again later.",
      503,
    );
}
export async function resetPassword(
  idValue: unknown,
  tokenValue: unknown,
  passwordValue: unknown,
) {
  if (!accountsEnabled())
    throw new AccountError("Account sign-in is not enabled.", 404);
  if (
    typeof idValue !== "string" ||
    !/^adminPasswordResets\.[a-f0-9]{64}$/.test(idValue) ||
    typeof tokenValue !== "string" ||
    !/^[a-f0-9]{64}$/.test(tokenValue)
  )
    throw new AccountError("Invalid password reset link.");
  if (!validPassword(passwordValue))
    throw new AccountError("Use a password of 12–128 characters.");
  const doc = await db().getDocument<EncryptedDocument>(idValue);
  if (!doc)
    throw new AccountError("This link is expired or has already been used.");
  const reset = unseal<{
    accountId: string;
    version: number;
    tokenHash: string;
    expiresAt: number;
  }>(doc._id, doc.payload);
  if (
    reset.expiresAt <= Date.now() ||
    !safeEqual(reset.tokenHash, digest("password-reset", tokenValue))
  )
    throw new AccountError("This link is expired or has already been used.");
  const accountDoc = await db().getDocument<EncryptedDocument>(reset.accountId);
  if (!accountDoc) throw new AccountError("Invalid password reset link.");
  const account = decodeStored(accountDoc);
  if (account.sessionVersion !== reset.version)
    throw new AccountError("This link is expired or has already been used.");
  const updated: StoredAccount = {
    ...account,
    passwordHash: await hashPassword(passwordValue),
    sessionVersion: account.sessionVersion + 1,
    updatedAt: new Date().toISOString(),
  };
  // A single revision-locked account update consumes the token and changes the hash.
  // Concurrent resets cannot both succeed; status and permissions never change.
  try {
    await db()
      .patch(accountDoc._id)
      .ifRevisionId(accountDoc._rev)
      .set({ payload: seal(accountDoc._id, updated) })
      .commit({ visibility: "sync" });
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 409)
      throw new AccountError("This link is expired or has already been used.");
    throw error;
  }
  await clearAccountSession();
}
