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
