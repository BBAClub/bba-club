import {
  DraftPage,
  DraftTable,
  Metrics,
  Panel,
} from "@/components/AdminSectionDraft";
import { requireAdminPermission } from "@/lib/admin/auth";
import { client } from "@/sanity/lib/client";

type Delivery = {
  _id: string;
  event?: string;
  status?: string;
  sentAt?: string;
};
const attention = ["bounced", "complained", "failed"];
export default async function CommunicationsPage() {
  await requireAdminPermission("communications");
  const data = await client.fetch<{
    sent: number;
    delivered: number;
    delayed: number;
    attention: number;
    recent: Delivery[];
  }>(
    `{
    "sent":count(*[_type == "eventRegistration" && defined(confirmationEmailSentAt)]),
    "delivered":count(*[_type == "eventRegistration" && emailDeliveryStatus == "delivered"]),
    "delayed":count(*[_type == "eventRegistration" && emailDeliveryStatus == "delayed"]),
    "attention":count(*[_type == "eventRegistration" && emailDeliveryStatus in $attention]),
    "recent":*[_type == "eventRegistration" && defined(confirmationEmailSentAt)] | order(confirmationEmailSentAt desc)[0...30] {_id,"event":event->title,"status":emailDeliveryStatus,"sentAt":confirmationEmailSentAt}
  }`,
    { attention },
    { cache: "no-store" },
  );
  return (
    <DraftPage
      title="Communications"
      description="Track delivery of automatic registration confirmations."
    >
      <Metrics
        items={[
          { label: "Confirmations recorded", value: data.sent },
          { label: "Delivered", value: data.delivered },
          { label: "Delayed", value: data.delayed },
          { label: "Needs attention", value: data.attention },
        ]}
      />
      <Panel title="Recent confirmations">
        <DraftTable
          headers={["Event", "Sent date", "Delivery status"]}
          empty="No registration confirmations recorded yet."
          rows={data.recent.map((item) => ({
            id: item._id,
            cells: [
              item.event || "Unknown event",
              item.sentAt?.slice(0, 10) || "—",
              item.status || "Awaiting delivery update",
            ],
          }))}
        />
      </Panel>
    </DraftPage>
  );
}
