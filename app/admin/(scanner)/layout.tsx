import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default function CheckInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell loginNext="/admin/check-in">{children}</AdminShell>;
}
