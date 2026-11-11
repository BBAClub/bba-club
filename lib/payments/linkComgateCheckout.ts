import type { SanityClient } from "@sanity/client";

export async function linkComgateCheckout(
  client: SanityClient,
  registrationId: string,
  attemptRef: string,
  payment: { transId: string; redirectUrl: string },
) {
  const current = await client.getDocument<{
    _rev: string;
    status?: string;
    paymentAttemptRef?: string;
    paymentTransactionId?: string;
  }>(registrationId);
  if (!current || current.status !== "pending-payment" ||
      current.paymentAttemptRef !== attemptRef ||
      (current.paymentTransactionId && current.paymentTransactionId !== payment.transId)) {
    throw new Error("Payment reservation changed before checkout was linked.");
  }
  await client.patch(registrationId).ifRevisionId(current._rev)
    .set({
      paymentTransactionId: payment.transId,
      paymentRedirectUrl: payment.redirectUrl,
    })
    .commit({ visibility: "sync" });
}
