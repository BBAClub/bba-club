import { NextResponse } from "next/server";
import {
  currentAccount,
  listAccounts,
  updateAccount,
  AccountError,
} from "@/lib/admin/accounts";
import {
  adminPermissions,
  type AdminPermission,
} from "@/lib/admin/permissions";
import { trustedRequest } from "@/lib/admin/security";
export const runtime = "nodejs";
export async function GET() {
  const actor = await currentAccount();
  if (!actor || actor.status !== "active" || actor.role !== "administrator")
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  return NextResponse.json(
    { accounts: await listAccounts() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function PATCH(request: Request) {
  if (!trustedRequest(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    const actor = await currentAccount();
    if (!actor || actor.status !== "active" || actor.role !== "administrator")
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    const body = await request.json();
    if (
      typeof body.id !== "string" ||
      !/^adminAccounts\.[a-f0-9]{64}$/.test(body.id) ||
      !Number.isInteger(body.revision) ||
      !["pending", "active", "disabled"].includes(body.status) ||
      !["member", "administrator"].includes(body.role) ||
      !Array.isArray(body.permissions) ||
      body.permissions.some(
        (value: unknown) =>
          !adminPermissions.includes(value as AdminPermission),
      ) ||
      (body.teamMemberId !== undefined && typeof body.teamMemberId !== "string")
    )
      throw new AccountError("Invalid account settings.");
    const account = await updateAccount(actor, body);
    return NextResponse.json({ account });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AccountError
            ? error.message
            : "Could not update the account.",
      },
      { status: error instanceof AccountError ? error.status : 500 },
    );
  }
}
