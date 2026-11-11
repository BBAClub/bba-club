import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { client } from "@/sanity/lib/client";

export function trustedRequestIp(request: Request) {
  // The ingress must overwrite this header, including on preview deployments.
  const header = process.env.TRUSTED_CLIENT_IP_HEADER;
  const address = header && request.headers.get(header)?.trim();
  return address && isIP(address) ? address : null;
}

export async function takeRequestQuota(scope: string, key: string, limit: number) {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error("Request quota storage is not configured.");
  const store = client.withConfig({ token, useCdn: false });
  const digest = createHmac("sha256", token).update(JSON.stringify([scope, key])).digest("hex");
  const id = `requestRate.${digest}`;
  const now = Date.now();
  const resetAt = now + 10 * 60_000;

  for (let attempt = 0; attempt < 4; attempt++) {
    const bucket = await store.createIfNotExists({
      _id: id, _type: "requestRate", count: 0, resetAt,
    });
    const expired = bucket.resetAt <= now;
    if (!expired && bucket.count >= limit) return false;

    try {
      await store.patch(id).ifRevisionId(bucket._rev).set({
        count: expired ? 1 : bucket.count + 1,
        resetAt: expired ? resetAt : bucket.resetAt,
      }).commit({ visibility: "async" });
      return true;
    } catch (error) {
      if ((error as { statusCode?: number })?.statusCode !== 409) throw error;
    }
  }
  return false;
}
