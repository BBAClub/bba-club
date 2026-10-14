"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type AdminDeleteEventProps = {
  title: string;
  slug: string;
};

export default function AdminDeleteEvent({
  title,
  slug,
}: AdminDeleteEventProps) {
  const router =
    useRouter();

  const [
    confirmation,
    setConfirmation,
  ] =
    useState("");

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const confirmed =
    confirmation ===
    title;

  async function deleteEvent() {
    if (
      !confirmed ||
      deleting
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response =
        await fetch(
          `/api/admin/events/${encodeURIComponent(
            slug
          )}/delete`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        (await response.json()) as {
          success?: boolean;
          error?: string;
        };

      if (!response.ok) {
        setError(
          data.error ??
            "Could not delete event."
        );

        return;
      }

      router.push(
        "/admin/events"
      );

      router.refresh();
    } catch {
      setError(
        "Could not delete event."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mt-8 rounded-[24px] border border-red-400/20 bg-red-400/[0.04] p-5 md:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">
        Danger zone
      </p>

      <h2 className="mt-2 text-lg font-semibold text-white">
        Delete event
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8EA0B3]">
        This permanently removes
        the event from Sanity.
        Events with existing
        registrations cannot be
        deleted.
      </p>

      <div className="mt-6 rounded-2xl border border-red-400/10 bg-[#071422]/60 p-4">
        <label className="text-xs font-semibold text-[#A9B5C3]">
          Type{" "}
          <span className="text-white">
            {title}
          </span>{" "}
          to confirm
        </label>

        <input
          value={
            confirmation
          }
          onChange={(
            event
          ) =>
            setConfirmation(
              event.target
                .value
            )
          }
          disabled={
            deleting
          }
          className="mt-3 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#53687D] focus:border-red-400/60 disabled:opacity-50"
          placeholder={
            title
          }
        />

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={
              deleteEvent
            }
            disabled={
              !confirmed ||
              deleting
            }
            className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting
              ? "Deleting..."
              : "Delete event"}
          </button>
        </div>
      </div>
    </section>
  );
}
