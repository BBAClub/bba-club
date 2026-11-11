import { trustedRequest } from "@/lib/admin/security";
import {
  NextResponse,
} from "next/server";

import {
  clearAdminSession,
} from "@/lib/admin/auth";

export const runtime =
  "nodejs";

export async function POST(request: Request) {
  if (!trustedRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await clearAdminSession();

  return NextResponse.json({
    success: true,
  });
}