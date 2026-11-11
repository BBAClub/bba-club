import Link from "next/link";
import {
  DraftPage,
  DraftTable,
  Metrics,
  Panel,
} from "@/components/AdminSectionDraft";
import { requireAdminPermission } from "@/lib/admin/auth";
import { client } from "@/sanity/lib/client";

type PaymentGroup = {
  event: string | null;
  currency: string;
  paid: number;
  refunded: number;
};

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminPermission("finance");
  const requested = Number((await searchParams).page ?? 1);
  const page = Number.isSafeInteger(requested) ? Math.max(1, Math.min(requested, 10_000)) : 1;
  const pageSize = 25;
  const offset = (page - 1) * pageSize;
  const overview = await client.fetch<{ keys: string[]; counts: Record<string, number> }>(
    `{
      "keys": (array::unique(*[_type == "eventRegistration" && paymentStatus in ["paid", "refunded"]]{
        "eventKey": coalesce(event._ref, "")
      }.eventKey) | order(@ asc))[${offset}...${offset + pageSize + 1}],
      "counts": {
        "paid": count(*[_type == "eventRegistration" && paymentStatus == "paid"]),
        "refunded": count(*[_type == "eventRegistration" && paymentStatus == "refunded"]),
        "pending": count(*[_type == "eventRegistration" && paymentStatus == "pending"]),
        "failed": count(*[_type == "eventRegistration" && paymentStatus == "failed"]),
        "pay_on_site": count(*[_type == "eventRegistration" && paymentStatus == "pay_on_site"])
      }
    }`,
    {},
    { cache: "no-store" },
  );
  const keys = overview.keys.slice(0, pageSize);
  const groups = keys.length ? await client.fetch<{
    pairs: string[];
    missingAmount: number;
  }>(
    `{
      "pairs": array::unique(*[_type == "eventRegistration"
        && paymentStatus in ["paid", "refunded"] && coalesce(event._ref, "") in $keys
        && defined(paymentAmount + 0) && defined(paymentCurrency)]{
        "pair": coalesce(event._ref, "") + "|" + paymentCurrency
      }.pair),
      "missingAmount": count(*[_type == "eventRegistration"
        && paymentStatus in ["paid", "refunded"] && coalesce(event._ref, "") in $keys
        && (!defined(paymentAmount + 0) || !defined(paymentCurrency))])
    }`,
    { keys },
    { cache: "no-store" },
  ) : { pairs: [], missingAmount: 0 };

  const totals: PaymentGroup[] = [];
  let missingAmount = groups.missingAmount;
  // Use bounded query batches even when legacy records use additional currencies.
  for (let offset = 0; offset < groups.pairs.length; offset += 50) {
    const params: Record<string, string> = {};
    const projections = groups.pairs.slice(offset, offset + 50).map((pair, index) => {
      const separator = pair.indexOf("|");
      const eventKey = pair.slice(0, separator);
      const currency = pair.slice(separator + 1);
      params[`event${index}`] = eventKey;
      params[`currency${index}`] = currency;
      const filter = `_type == "eventRegistration" && coalesce(event._ref, "") == $event${index}
        && paymentCurrency == $currency${index} && defined(paymentAmount + 0)`;
      return `{
        "event": *[_id == $event${index}][0].title,
        "currency": $currency${index},
        "paid": math::sum(*[${filter} && paymentStatus == "paid"].paymentAmount),
        "refunded": math::sum(*[${filter} && paymentStatus == "refunded"].paymentAmount),
        "records": count(*[${filter} && paymentStatus in ["paid", "refunded"]])
      }`;
    });
    const rows = await client.fetch<Array<PaymentGroup & { records: number }>>(
      `[${projections.join(",")}]`,
      params,
      { cache: "no-store" },
    );
    for (const row of rows) {
      if (/^[A-Z]{3}$/.test(row.currency)) totals.push(row);
      else missingAmount += row.records;
    }
  }
  const latePayments = await client.fetch<{
    count: number;
    recent: { _id: string; latePaidTransactionId: string; event?: string }[];
  }>(
    `{
      "count": count(*[_type == "comgatePaymentAttempt" && defined(latePaidTransactionId)]),
      "recent": *[_type == "comgatePaymentAttempt" && defined(latePaidTransactionId)]
        | order(latePaidRecordedAt desc)[0...25] {
          _id, latePaidTransactionId, "event": *[_id == ^.eventId][0].title
        }
    }`,
    {},
    { cache: "no-store" },
  );
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
          { label: "Paid", value: overview.counts.paid ?? 0 },
          { label: "Pending", value: overview.counts.pending ?? 0 },
          { label: "Refunded", value: overview.counts.refunded ?? 0 },
          { label: "Pay on site", value: overview.counts.pay_on_site ?? 0 },
          { label: "Failed", value: overview.counts.failed ?? 0 },
        ]}
      />
      {latePayments.count > 0 && (
        <Panel title="Late Comgate payments">
          <p className="text-sm text-[#A9B5C3]">
            These payments belong to a previous checkout. Review them in Comgate.
            Showing the latest {latePayments.recent.length} of {latePayments.count}.
          </p>
          <DraftTable
            headers={["Event", "Comgate transaction"]}
            empty="No late payments recorded."
            rows={latePayments.recent.map(payment => ({
              id: payment._id,
              cells: [payment.event || "Unknown event", payment.latePaidTransactionId],
            }))}
          />
        </Panel>
      )}
      <Panel title="Recorded amounts">
        <p className="text-sm text-[#A9B5C3]">
          Based on the amount and currency stored with each paid or refunded
          registration.
          {missingAmount
            ? ` Records on this page missing an amount or currency: ${missingAmount}.`
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
          rows={totals.map((row, index) => ({
            id: String(index),
            cells: [
              row.event || "Unknown event",
              row.currency,
              money(row.paid ?? 0, row.currency),
              money(row.refunded ?? 0, row.currency),
            ],
          }))}
        />
        <nav aria-label="Finance pages" className="mt-5 flex gap-4 text-sm">
          {page > 1 && <Link href={`?page=${page - 1}`}>Previous</Link>}
          <span>Page {page}</span>
          {overview.keys.length > pageSize && <Link href={`?page=${page + 1}`}>Next</Link>}
        </nav>
      </Panel>
    </DraftPage>
  );
}
