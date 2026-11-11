const pragueClock = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Prague",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const ticketGracePeriod = 60 * 60 * 1000;
export const ticketLeadTime = 24 * 60 * 60 * 1000;

export function eventStart(date?: string, time?: string) {
  const parts = /^(\d{1,2}):(\d{2})$/.exec(time?.trim() ?? "");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !parts) return null;
  const local = date + " " + parts[1].padStart(2, "0") + ":" + parts[2];
  const utc = Date.parse(local.replace(" ", "T") + ":00Z");
  if (!Number.isFinite(utc)) return null;
  // Prague uses UTC+1 in winter and UTC+2 in summer. Verify the local
  // round trip to reject invalid dates and skipped DST times.
  for (const offset of [2, 1]) {
    const candidate = utc - offset * 60 * 60 * 1000;
    if (pragueClock.format(candidate) === local) return candidate;
  }
  return null;
}

export function ticketWindow(now: number) {
  return {
    today: pragueClock.format(now - ticketGracePeriod).slice(0, 10),
    nextDay: pragueClock.format(now + ticketLeadTime).slice(0, 10),
  };
}
