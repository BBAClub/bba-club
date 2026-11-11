import type { SanityClient } from "@sanity/client";
import { randomUUID } from "node:crypto";

export async function readEventCapacity(client: SanityClient, eventId: string, now = new Date().toISOString(), excludeId = "") {
  return client.fetch<{
    _rev: string;
    capacity?: number;
    registrationStatus?: string;
    occupied: number;
  } | null>(
    `*[_type == "event" && _id == $eventId][0] {
      _rev, capacity, registrationStatus,
      "occupied": count(*[_type == "eventRegistration" && event._ref == $eventId && _id != $excludeId &&
        (status in ["confirmed", "checked-in"] ||
          (status == "pending-payment" && paymentStatus == "pending" &&
            reservationExpiresAt > $now))])
    }`,
    { eventId, now, excludeId },
    { cache: "no-store" },
  );
}

// Change the event revision in the same transaction as the allocation.
// A snapshot taken before another allocation cannot authorize a second write.
export function capacityTransaction(client: SanityClient, eventId: string, revision: string) {
  return client.transaction().patch(eventId, patch =>
    patch.ifRevisionId(revision).set({ capacityRevision: randomUUID() }),
  );
}

export function capacityConflict(error: unknown) {
  return (error as { statusCode?: number } | null)?.statusCode === 409;
}


export function paidRegistrationStatus(
  registration: { status?: string; paymentStatus?: string; reservationExpiresAt?: string },
  event: { capacity?: number; occupied: number; registrationStatus?: string },
  now: string,
) {
  if (registration.status === "checked-in") return "checked-in";
  if (registration.status === "confirmed") return "confirmed";

  const holdsSeat = registration.status === "pending-payment" &&
    registration.paymentStatus === "pending" &&
    Date.parse(registration.reservationExpiresAt ?? "") > Date.parse(now);
  const full = event.registrationStatus === "full" ||
    (typeof event.capacity === "number" && event.capacity > 0 &&
      event.occupied >= event.capacity);
  return !holdsSeat && full ? "waitlist" : "confirmed";
}
