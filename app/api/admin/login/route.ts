import { takeRequestQuota, trustedRequestIp } from "@/lib/requestRateLimit";
import { NextResponse } from "next/server";
import { createAdminSession, verifyAdminPassword } from "@/lib/admin/auth";
import {
  accountsEnabled,
  AccountError,
  requestCode,
  passwordSignIn,
} from "@/lib/admin/accounts";
import { trustedRequest } from "@/lib/admin/security";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!trustedRequest(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    if (Number(request.headers.get("content-length")) > 16_384) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    const source = trustedRequestIp(request);
    if (source && !(await takeRequestQuota("login:source", source, 25))) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const body = await request.json();
    if (accountsEnabled()) {
      if (body.action === "register") {
        await requestCode(body.email, body.name);
        return NextResponse.json({ success: true });
      }
      const account = await passwordSignIn(body.email, body.password);
      return NextResponse.json({ success: true, status: account.status });
    }
    if (
      typeof body.password !== "string" ||
      !verifyAdminPassword(body.password)
    )
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    await createAdminSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AccountError
            ? error.message
            : "Could not sign in. Please try again later.",
      },
      { status: error instanceof AccountError ? error.status : 500 },
    );
  }
}
