import "server-only";
import { setTimeout as delay } from "node:timers/promises";
import { eventStart, ticketGracePeriod, ticketLeadTime, ticketWindow } from "./eventTicketTiming";
import { sendEventRegistrationEmail } from "./sendEventRegistrationEmail";
import { ticketDeliveryStore } from "./ticketDeliveryStore";

type Registration = {
  _id: string;
  _rev: string;
  status: string;
  paymentStatus?: string;
  ticketCode: string;
  ticketEmailQueuedFor?: string;
  ticketEmailSentFor?: string;
  ticketEmailAttemptedAt?: string;
  firstName: string;
  email: string;
};
type Event = {
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  location?: string;
  address?: string;
};
const payable = ["paid", "not_required", "pay_on_site"];
const retryDelay = 5 * 60 * 1000;

function eligible(registration: Registration, now: number) {
  return (
    registration.status === "confirmed" &&
    (!registration.paymentStatus ||
      payable.includes(registration.paymentStatus)) &&
    !!registration.email &&
    !!registration.ticketCode &&
    registration.ticketEmailQueuedFor === registration.ticketCode &&
    registration.ticketEmailSentFor !== registration.ticketCode &&
    (!registration.ticketEmailAttemptedAt ||
      Date.parse(registration.ticketEmailAttemptedAt) <= now - retryDelay)
  );
}

export async function sendDueEventTickets(now = Date.now()) {
  const store = ticketDeliveryStore();
  if (!store) throw new Error("Ticket delivery requires a Sanity write token.");
  const { today, nextDay } = ticketWindow(now);
  const candidates = await store.fetch<(Registration & { event?: Event })[]>(
    `*[_type == "eventRegistration" && status == "confirmed"
      && defined(ticketEmailQueuedFor) && ticketEmailQueuedFor == ticketCode
      && coalesce(ticketEmailSentFor, "") != ticketCode
      && (!defined(paymentStatus) || paymentStatus in $payable)
      && (!defined(ticketEmailAttemptedAt) || ticketEmailAttemptedAt <= $retryBefore)
      && defined(event->title)
      && (!defined(event->date) || (event->date >= $today && event->date <= $nextDay))]
      | order(ticketEmailAttemptedAt asc, event->date asc) {
        _id,_rev,status,paymentStatus,ticketCode,ticketEmailQueuedFor,ticketEmailSentFor,ticketEmailAttemptedAt,firstName,email,
        "event":event->{title,date,time,venue,location,address}
      }`,
    {
      today,
      nextDay,
      payable,
      retryBefore: new Date(now - retryDelay).toISOString(),
    },
    { cache: "no-store" },
  );

  const due = candidates
    .filter((registration) => {
      if (!registration.event || !eligible(registration, now)) return false;
      const start = eventStart(
        registration.event.date,
        registration.event.time,
      );
      // A missing/invalid time must not leave a confirmed guest without a ticket.
      return start === null || (now <= start + ticketGracePeriod && start - now <= ticketLeadTime);
    });

  const summary = { due: due.length, sent: 0, failed: 0, skipped: 0, remaining: due.length };
  const deadline = performance.now() + 40_000;
  let nextSendAt = 0;
  // Claim the same revision we inspected, so another scheduler run or a
  // cancellation that changed it in the meantime takes precedence.
  for (const registration of due.slice(0, 80)) {
    if (performance.now() >= deadline) break;
    summary.remaining--;
    const event = registration.event!;
    try {
      await store
        .patch(registration._id)
        .ifRevisionId(registration._rev)
        .set({
          ticketEmailAttemptedAt: new Date(now).toISOString(),
        })
        .commit({ visibility: "sync" });
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 409) {
        summary.skipped++;
        continue;
      }
      summary.failed++;
      continue;
    }
    try {
      const current = await store.getDocument<Registration>(registration._id);
      if (
        !current ||
        current.ticketCode !== registration.ticketCode ||
        !eligible({ ...current, ticketEmailAttemptedAt: undefined }, now)
      ) {
        summary.skipped++;
        continue;
      }
      const wait = nextSendAt - performance.now();
      if (wait > 0) await delay(wait);
      nextSendAt = performance.now() + 300;
      const result = await sendEventRegistrationEmail({
        registrationId: current._id,
        ticketCode: current.ticketCode,
        status: "confirmed",
        firstName: current.firstName || "",
        email: current.email,
        eventTitle: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        location: event.location,
        address: event.address,
        ticketOnly: true,
      });
      if (!result.sent) {
        summary.failed++;
        continue;
      }
      await store
        .patch(current._id)
        .set({
          ticketEmailSentFor: current.ticketCode,
          ticketEmailSentAt: new Date().toISOString(),
        })
        .commit({ visibility: "sync" });
      summary.sent++;
    } catch (error) {
      console.error(
        "Scheduled ticket delivery failed:",
        registration._id,
        error instanceof Error ? error.name : "Unknown error",
      );
      summary.failed++;
    }
  }
  return summary;
}
