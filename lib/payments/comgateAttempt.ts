export function comgateAttemptDocument(
  reference: string,
  registrationId: string,
  eventId: string,
  amount: number,
  currency: string,
) {
  return {
    _id: comgateAttemptId(reference),
    _type: "comgatePaymentAttempt",
    registrationId,
    eventId,
    amountInMinorUnits: Math.round(amount * 100),
    currency,
  };
}

export function comgateAttemptId(reference: string) {
  return `private.comgate-attempt-${reference}`;
}

export function isComgateAttemptReference(reference: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(reference);
}
