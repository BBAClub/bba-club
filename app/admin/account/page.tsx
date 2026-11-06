import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/admin/accounts";
import AdminSignOut from "@/components/AdminSignOut";
export const dynamic = "force-dynamic";
export default async function AccountPage() {
  const account = await currentAccount();
  if (!account) redirect("/admin/login");
  if (account.status === "active") redirect("/admin");
  return (
    <main className="min-h-screen bg-[#071422] px-5 py-20 text-white">
      <section className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[#0D1D2C] p-8">
        <p className="text-sm text-[#8EC5FF]">BBA Club admin</p>
        <h1 className="mt-4 text-2xl font-bold">
          {account.status === "pending"
            ? "Waiting for approval"
            : "Access disabled"}
        </h1>
        <p className="my-5 text-sm leading-6 text-[#A9B5C3]">
          {account.email}
          <br />
          {account.status === "pending"
            ? "Your school email is verified. An administrator needs to approve your account before you can enter the admin."
            : "An administrator has disabled your access. Contact BBA Club if you need help."}
        </p>
        <a
          href="/admin/account"
          className="mb-5 inline-block text-sm text-[#8EC5FF]"
        >
          Check approval status
        </a>
        <AdminSignOut />
      </section>
    </main>
  );
}
