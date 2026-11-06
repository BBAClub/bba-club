import {
  createHmac,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export function schoolEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 &&
    /^[a-z0-9]+(?:[._+-][a-z0-9]+)*@vse\.cz$/.test(email)
    ? email
    : null;
}
function secret() {
  const value = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!value || value.length < 32)
    throw new Error(
      "ADMIN_SESSION_SECRET must contain at least 32 characters.",
    );
  return value;
}
export function digest(purpose: string, value: string) {
  return createHmac("sha256", secret())
    .update(`${purpose}:${value}`)
    .digest("hex");
}
export function safeEqual(a: string, b: string) {
  const first = Buffer.from(a),
    second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second);
}
// Separate encryption key and authenticated context for every record/token kind.
export function seal(purpose: string, value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    Buffer.from(digest("encryption", purpose), "hex"),
    iv,
  );
  cipher.setAAD(Buffer.from(purpose));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    "base64url",
  );
}
export function unseal<T>(purpose: string, value: string): T {
  const raw = Buffer.from(value, "base64url");
  if (raw.length < 29) throw new Error("Invalid encrypted record.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(digest("encryption", purpose), "hex"),
    raw.subarray(0, 12),
  );
  decipher.setAAD(Buffer.from(purpose));
  decipher.setAuthTag(raw.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([
      decipher.update(raw.subarray(28)),
      decipher.final(),
    ]).toString("utf8"),
  ) as T;
}
export function trustedRequest(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_SITE_URL;
  const allowed = [new URL(request.url).origin];
  if (expected) allowed.push(new URL(expected).origin);
  return (
    !!origin &&
    allowed.includes(origin) &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}
