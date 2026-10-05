import {
  redirect,
} from "next/navigation";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const dynamic =
  "force-dynamic";

export default async function AdminPage() {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    redirect(
      "/admin/login?next=/admin/events"
    );
  }

  redirect(
    "/admin/events"
  );
}