import { NextResponse } from "next/server";
import {
  AccountError,
  requestPasswordReset,
  resetPassword,
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
    if (body.action === "request") await requestPasswordReset(body.email);
    else if (body.action === "reset")
      await resetPassword(body.id, body.token, body.password);
    else throw new AccountError("Invalid request.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AccountError
            ? error.message
            : "Could not process the request. Please try again.",
      },
      { status: error instanceof AccountError ? error.status : 500 },
    );
  }
}
