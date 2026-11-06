import { requireAdminPermission } from "@/lib/admin/auth";
export default async function SectionLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission("places");
  return children;
}
