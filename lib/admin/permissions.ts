export const adminPermissions = [
  "events",
  "registrations",
  "places",
  "study",
  "checkin",
  "tasks",
  "communications",
  "finance",
  "wiki",
  "team",
  "settings",
] as const;
export type AdminPermission = (typeof adminPermissions)[number];
export type AdminAccount = {
  id: string;
  email: string;
  name: string;
  status: "pending" | "active" | "disabled";
  role: "administrator" | "member";
  permissions: AdminPermission[];
  sessionVersion: number;
  verifiedAt: string;
  updatedAt: string;
  updatedBy?: string;
  teamMemberId?: string;
};
export function canAccess(account: AdminAccount, permission?: AdminPermission) {
  return (
    account.status === "active" &&
    (!permission ||
      account.role === "administrator" ||
      account.permissions.includes(permission))
  );
}
export function permissionForPath(
  path: string,
): AdminPermission | "users" | undefined {
  if (path === "/check-in") return "checkin";
  const section = path.split("/")[2];
  if (section === "users") return "users";
  return adminPermissions.find((value) => value === section);
}
