import { DraftLink, DraftPage, Panel } from "@/components/AdminSectionDraft";
import { currentAccount } from "@/lib/admin/accounts";
import { requireAdminPermission } from "@/lib/admin/auth";
import { canAccess, type AdminPermission } from "@/lib/admin/permissions";

const guides: {
  title: string;
  steps: string[];
  href: string;
  permission: AdminPermission;
  label: string;
}[] = [
  {
    title: "Prepare an event",
    steps: [
      "Fill in the date, venue, capacity and registration settings.",
      "Check the public event page before sharing it.",
      "Assign preparation and follow-up in Tasks.",
    ],
    href: "/admin/events",
    permission: "events",
    label: "Open Events",
  },
  {
    title: "Run event check-in",
    steps: [
      "Select the correct event and test the scanner before doors open.",
      "Scan each ticket and follow the on-screen payment and attendance status.",
      "Review attendance in Registrations after the event.",
    ],
    href: "/admin/check-in",
    permission: "checkin",
    label: "Open Check-in",
  },
  {
    title: "Review study materials",
    steps: [
      "Open the pending submissions in Study.",
      "Check that the course and title match the material, and that the club can share it.",
      "Confirm published resources appear in the public Study Hub.",
    ],
    href: "/admin/study",
    permission: "study",
    label: "Open Study",
  },
];

export default async function WikiPage() {
  await requireAdminPermission("wiki");
  const account = await currentAccount();
  return (
    <DraftPage
      title="Wiki"
      description="Starter checklists for common BBA Club operations."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {guides.map((guide) => (
          <Panel key={guide.title} title={guide.title}>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-[#A9B5C3]">
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {(!account || canAccess(account, guide.permission)) && (
              <DraftLink href={guide.href}>{guide.label}</DraftLink>
            )}
          </Panel>
        ))}
      </div>
    </DraftPage>
  );
}
