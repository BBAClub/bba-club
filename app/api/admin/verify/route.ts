import { NextResponse } from "next/server";
import { AccountError, verifyCode } from "@/lib/admin/accounts";
import { trustedRequest } from "@/lib/admin/security";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!trustedRequest(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    const { code, password } = await request.json();
    const account = await verifyCode(code, password);
    return NextResponse.json({ success: true, status: account.status });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AccountError
            ? error.message
            : "Could not verify the code. Please try again.",
      },
      { status: error instanceof AccountError ? error.status : 500 },
    );
  }
}
