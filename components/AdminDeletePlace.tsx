"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

export default function AdminDeletePlace({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router =
    useRouter();

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  async function deletePlace() {
    const confirmed =
      window.confirm(
        `Delete "${name}"? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response =
        await fetch(
          `/api/admin/places/${encodeURIComponent(
            id
          )}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        (await response.json()) as {
          error?: string;
        };

      if (!response.ok) {
        setError(
          data.error ??
            "Could not delete place."
        );

        return;
      }

      router.push(
        "/admin/places"
      );

      router.refresh();
    } catch {
      setError(
        "Could not delete place."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mt-8 rounded-[24px] border border-red-400/20 bg-red-400/[0.04] p-5 md:p-6">
      <h2 className="text-lg font-semibold text-white">
        Delete place
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#8EA0B3]">
        Permanently remove this
        place from Explore Prague.
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={
          deletePlace
        }
        disabled={
          deleting
        }
        className="mt-5 rounded-xl border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
      >
        {deleting
          ? "Deleting..."
          : "Delete place"}
      </button>
    </section>
  );
}
