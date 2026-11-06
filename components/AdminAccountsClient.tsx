"use client";
import { useState } from "react";
import { adminPermissions, type AdminAccount } from "@/lib/admin/permissions";
const field =
  "w-full rounded-xl border border-white/10 bg-[#071422] px-3 py-2 text-sm";
export default function AdminAccountsClient({
  initialAccounts,
  actorId,
  primaryEmail,
  members,
}: {
  initialAccounts: AdminAccount[];
  actorId: string;
  primaryEmail: string;
  members: { _id: string; name: string }[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  function edit(id: string, changes: Partial<AdminAccount>) {
    setAccounts((all) =>
      all.map((a) => (a.id === id ? { ...a, ...changes } : a)),
    );
  }
  async function save(account: AdminAccount) {
    setBusy(account.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: account.id,
          revision: account.sessionVersion,
          status: account.status,
          role: account.role,
          permissions: account.permissions,
          teamMemberId: account.teamMemberId ?? "",
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Could not save account.");
      edit(account.id, data.account);
      setMessage(
        `Access saved for ${account.name}. They can sign in again to use the updated access.`,
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save account.",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#8EC5FF]">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold">Access & accounts</h1>
        <p className="mt-3 text-sm text-[#A9B5C3]">
          Approve verified school accounts, assign section access and link team
          profiles. Administrators have full access.
        </p>
      </header>
      <div className="flex flex-wrap gap-4 text-sm text-[#A9B5C3]">
        <span>
          {accounts.filter((a) => a.status === "pending").length} pending
        </span>
        <span>
          {accounts.filter((a) => a.status === "active").length} active
        </span>
        <span>
          {accounts.filter((a) => a.status === "disabled").length} disabled
        </span>
        <a href="/admin/users" className="text-[#8EC5FF]">
          Refresh requests
        </a>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-red-400/10 p-4 text-red-200">
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl bg-green-400/10 p-4 text-green-200"
        >
          {message}
        </p>
      )}
      {accounts.map((account) => {
        const locked = account.id === actorId || account.email === primaryEmail;
        return (
          <section
            key={account.id}
            className="rounded-3xl border border-white/10 bg-[#0B1A29] p-5 md:p-6"
          >
            <h2 className="font-semibold">{account.name}</h2>
            <p className="mt-1 text-sm text-[#A9B5C3]">{account.email}</p>
            <p className="mt-2 text-xs text-[#71869A]">
              Email verified:{" "}
              {new Date(account.verifiedAt).toLocaleDateString("en-GB")}
            </p>
            <fieldset
              disabled={!!busy}
              className="mt-5 space-y-5 disabled:opacity-60"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-xs">
                  Status
                  <select
                    disabled={locked}
                    className={field}
                    value={account.status}
                    onChange={(e) =>
                      edit(account.id, {
                        status: e.target.value as AdminAccount["status"],
                      })
                    }
                  >
                    <option value="pending">Pending approval</option>
                    <option value="active">Active — approved</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
                <label className="space-y-2 text-xs">
                  Role
                  <select
                    disabled={locked}
                    className={field}
                    value={account.role}
                    onChange={(e) =>
                      edit(account.id, {
                        role: e.target.value as AdminAccount["role"],
                      })
                    }
                  >
                    <option value="member">Member — selected sections</option>
                    <option value="administrator">
                      Administrator — full access
                    </option>
                  </select>
                </label>
                <label className="space-y-2 text-xs">
                  Team profile
                  <select
                    className={field}
                    value={account.teamMemberId ?? ""}
                    onChange={(e) =>
                      edit(account.id, { teamMemberId: e.target.value })
                    }
                  >
                    <option value="">Not linked</option>
                    {members.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {account.role === "member" && (
                <div>
                  <p className="mb-3 text-xs text-[#A9B5C3]">
                    Allowed sections (view and manage)
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {adminPermissions.map((permission) => (
                      <label
                        key={permission}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          disabled={locked}
                          type="checkbox"
                          checked={account.permissions.includes(permission)}
                          onChange={(e) =>
                            edit(account.id, {
                              permissions: e.target.checked
                                ? [...account.permissions, permission]
                                : account.permissions.filter(
                                    (p) => p !== permission,
                                  ),
                            })
                          }
                        />
                        {permission === "checkin" ? "Check-in" : permission}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => save(account)}
                className="rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-semibold"
              >
                {busy === account.id ? "Saving…" : "Save access"}
              </button>
            </fieldset>
            {locked && (
              <p className="mt-4 text-xs text-[#71869A]">
                {account.email === primaryEmail
                  ? "Primary administrator — access protected."
                  : "You cannot change your own access."}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
