import { currentAccount } from "@/lib/admin/accounts";
import AdminPasswordResetClient from "@/components/AdminPasswordResetClient";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Set or reset password | BBA Club",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export default async function ResetPasswordPage() {
  const account = await currentAccount();
  return (
    <main className="min-h-screen bg-[#071422] px-5 py-20 text-[#F6F8FB]">
      <AdminPasswordResetClient initialEmail={account?.email} />
    </main>
  );
}
