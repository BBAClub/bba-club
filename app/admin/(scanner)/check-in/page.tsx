import CheckInClient from "@/components/CheckInClient";
import { requireAdminPermission } from "@/lib/admin/auth";
import { client } from "@/sanity/lib/client";

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  await requireAdminPermission("checkin", "/admin/login?next=/admin/check-in");
  const { event } = await searchParams;
  const events = await client.fetch<{ _id: string; title: string; date?: string }[]>(
    '*[_type == "event" && defined(title)] | order(date desc) { _id, title, date }',
  );
  const selected = events.find(item => item._id === event);

  return (
    <>
      <form className="mx-auto mb-6 flex max-w-3xl flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2 text-sm">
          Check-in event
          <select name="event" defaultValue={selected?._id ?? ""} required
            className="rounded-xl border border-white/20 bg-[#0D1D2C] px-3 py-2">
            <option value="" disabled>Select an event</option>
            {events.map(item => (
              <option key={item._id} value={item._id}>
                {item.date ? `${item.date} · ` : ""}{item.title}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-semibold">
          Open check-in
        </button>
      </form>
      {selected && <CheckInClient key={selected._id} eventId={selected._id} />}
    </>
  );
}
