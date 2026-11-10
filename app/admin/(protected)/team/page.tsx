import {
  DraftLink,
  DraftPage,
  DraftTable,
  Panel,
} from "@/components/AdminSectionDraft";
import { requireAdminPermission } from "@/lib/admin/auth";
import { currentAccount } from "@/lib/admin/accounts";
import { client } from "@/sanity/lib/client";

type Member = { _id: string; name?: string; role?: string; isActive?: boolean };
export default async function TeamPage() {
  await requireAdminPermission("team");
  const [members, account] = await Promise.all([
    client.fetch<Member[]>(
      `*[_type == "teamMember"] | order(order asc, name asc) {_id,name,role,"isActive":coalesce(isActive,true)}`,
      {},
      { cache: "no-store" },
    ),
    currentAccount(),
  ]);
  return (
    <DraftPage
      title="Team"
      description="See the club profiles that appear on the public About page."
    >
      <Panel title="Team profiles">
        <DraftTable
          headers={["Name", "Club role", "Website visibility"]}
          empty="No team profiles yet."
          rows={members.map((member) => ({
            id: member._id,
            cells: [
              member.name || "Unnamed",
              member.role || "—",
              member.isActive ? "Visible" : "Hidden",
            ],
          }))}
        />
        <p className="text-sm">
          <DraftLink href="/about">Open public About page</DraftLink>
        </p>
      </Panel>
      {account?.role === "administrator" && (
        <Panel title="Admin access">
          <p className="text-sm text-[#A9B5C3]">
            Approve accounts, set section permissions and link accounts to team
            profiles.
          </p>
          <DraftLink href="/admin/users">Access &amp; accounts</DraftLink>
        </Panel>
      )}
    </DraftPage>
  );
}
