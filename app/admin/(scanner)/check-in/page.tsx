import CheckInClient from "@/components/CheckInClient";
import { requireAdminPermission } from "@/lib/admin/auth";

export default async function CheckInPage() {
  await requireAdminPermission("checkin", "/admin/login?next=/admin/check-in");
  return <CheckInClient />;
}
