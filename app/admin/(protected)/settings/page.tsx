import { DraftLink, DraftPage, Panel } from "@/components/AdminSectionDraft";
import { currentAccount } from "@/lib/admin/accounts";
import { requireAdminPermission } from "@/lib/admin/auth";
import { adminPermissions, canAccess } from "@/lib/admin/permissions";

export default async function SettingsPage() {
  await requireAdminPermission("settings");
  const account = await currentAccount();
  return (
    <DraftPage
      title="Settings"
      description="Review your account and the sections available to you."
    >
      <Panel title="Your account">
        {account ? (
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[#A9B5C3]">Name</dt>
              <dd>{account.name}</dd>
            </div>
            <div>
              <dt className="text-[#A9B5C3]">School email</dt>
              <dd>{account.email}</dd>
            </div>
            <div>
              <dt className="text-[#A9B5C3]">Account role</dt>
              <dd className="capitalize">{account.role}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-[#A9B5C3]">
            Signed in with shared staff access.
          </p>
        )}
        {account && (
          <DraftLink href="/admin/reset-password">
            Set or reset password
          </DraftLink>
        )}
      </Panel>
      {account && (
        <Panel title="Section access">
          <ul className="flex flex-wrap gap-2 text-sm">
            {adminPermissions
              .filter((permission) => canAccess(account, permission))
              .map((permission) => (
                <li
                  className="rounded-full border border-white/15 px-3 py-1 capitalize"
                  key={permission}
                >
                  {permission === "checkin" ? "Check-in" : permission}
                </li>
              ))}
          </ul>
        </Panel>
      )}
    </DraftPage>
  );
}
