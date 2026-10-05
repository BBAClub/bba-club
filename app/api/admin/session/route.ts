import {
  NextResponse,
} from "next/server";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const runtime =
  "nodejs";

export async function GET() {
  const authenticated =
    await isAdminAuthenticated();

  return NextResponse.json({
    authenticated,
  });
}