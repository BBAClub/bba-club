import { requireAdminPermission } from "@/lib/admin/auth";
import EventDashboardClient from "@/components/EventDashboardClient";

export const dynamic =
  "force-dynamic";

export default async function RegistrationsPage() {
  await requireAdminPermission("registrations");
  return (
    <EventDashboardClient />
  );
}
