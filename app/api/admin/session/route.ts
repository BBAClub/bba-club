import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { currentAccount } from "@/lib/admin/accounts";
export const runtime = "nodejs";
export async function GET() {
  const account = await currentAccount();
  return NextResponse.json(
    {
      authenticated: await isAdminAuthenticated(),
      account: account
        ? {
            id: account.id,
            name: account.name,
            email: account.email,
            status: account.status,
            role: account.role,
            permissions: account.permissions,
            teamMemberId: account.teamMemberId,
          }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
