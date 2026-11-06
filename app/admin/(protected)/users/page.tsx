import {
  bootstrapEmail,
  currentAccount,
  listAccounts,
} from "@/lib/admin/accounts";
import { requireAdminPermission } from "@/lib/admin/auth";
import { client } from "@/sanity/lib/client";
import AdminAccountsClient from "@/components/AdminAccountsClient";
export const dynamic = "force-dynamic";
export default async function AccountsPage() {
  await requireAdminPermission("users");
  const actor = await currentAccount();
  const members = await client.fetch<{ _id: string; name: string }[]>(
    '*[_type == "teamMember" && !(_id in path("drafts.**"))] | order(name asc) {_id, name}',
    {},
    { cache: "no-store" },
  );
  return (
    <AdminAccountsClient
      initialAccounts={await listAccounts()}
      actorId={actor!.id}
      primaryEmail={bootstrapEmail()!}
      members={members}
    />
  );
}
