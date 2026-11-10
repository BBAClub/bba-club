import {
  DraftPage,
  DraftTable,
  Metrics,
  Panel,
} from "@/components/AdminSectionDraft";
import { requireAdminPermission } from "@/lib/admin/auth";
import { client } from "@/sanity/lib/client";

type Payment = {
  eventId?: string;
  event?: string;
  status: string;
  amount?: number;
  currency?: string;
};
export default async function FinancePage() {
  await requireAdminPermission("finance");
  const payments = await client.fetch<Payment[]>(
    `*[_type == "eventRegistration" && paymentStatus in ["paid","refunded","pending","failed","pay_on_site"]] {
    "eventId": event._ref, "event": event->title, "status": paymentStatus, "amount": paymentAmount, "currency": paymentCurrency
  }`,
    {},
    { cache: "no-store" },
  );
  const counts = new Map<string, number>();
  const totals = new Map<
    string,
    { event: string; currency: string; paid: number; refunded: number }
  >();
  let missingAmount = 0;
  for (const payment of payments) {
    counts.set(payment.status, (counts.get(payment.status) ?? 0) + 1);
    if (payment.status !== "paid" && payment.status !== "refunded") continue;
    if (
      typeof payment.amount !== "number" ||
      !payment.currency ||
      !/^[A-Z]{3}$/.test(payment.currency)
    ) {
      missingAmount++;
      continue;
    }
    const key = JSON.stringify([payment.eventId, payment.currency]);
    const row = totals.get(key) ?? {
      event: payment.event || "Unknown event",
      currency: payment.currency,
      paid: 0,
      refunded: 0,
    };
    if (payment.status === "paid") row.paid += payment.amount;
    else row.refunded += payment.amount;
    totals.set(key, row);
  }
  const money = (value: number, currency: string) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
      value,
    );
  return (
    <DraftPage
      title="Finance"
      description="Review payment states and recorded amounts by event and currency."
    >
      <Metrics
        items={[
          { label: "Paid", value: counts.get("paid") ?? 0 },
          { label: "Pending", value: counts.get("pending") ?? 0 },
          { label: "Refunded", value: counts.get("refunded") ?? 0 },
          { label: "Pay on site", value: counts.get("pay_on_site") ?? 0 },
          { label: "Failed", value: counts.get("failed") ?? 0 },
        ]}
      />
      <Panel title="Recorded amounts">
        <p className="text-sm text-[#A9B5C3]">
          Based on the amount and currency stored with each paid or refunded
          registration.
          {missingAmount
            ? ` Records missing an amount or currency: ${missingAmount}.`
            : ""}
        </p>
        <DraftTable
          headers={[
            "Event",
            "Currency",
            "Paid ticket value",
            "Refunded ticket value",
          ]}
          empty="No paid or refunded amounts recorded yet."
          rows={Array.from(totals, ([id, row]) => ({
            id,
            cells: [
              row.event,
              row.currency,
              money(row.paid, row.currency),
              money(row.refunded, row.currency),
            ],
          }))}
        />
      </Panel>
    </DraftPage>
  );
}
