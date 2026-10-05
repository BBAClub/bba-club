"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

function getSafeDestination(
  value: string | null
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/admin/events";
  }

  return value;
}

export default function AdminLoginClient() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      submitting
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/admin/login",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                password,
              }),
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
            "Could not sign in."
        );

        return;
      }

      const destination =
        getSafeDestination(
          searchParams.get(
            "next"
          )
        );

      router.replace(
        destination
      );

      router.refresh();
    } catch {
      setError(
        "Could not sign in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#0D1D2C] p-6 md:p-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0057FF] text-lg font-bold">
        B
      </div>

      <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
        BBA Club staff
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
        Admin access
      </h1>

      <p className="mt-3 text-sm leading-6 text-[#8EA0B3]">
        Sign in to manage
        events, registrations
        and check-in.
      </p>

      <form
        onSubmit={
          handleSubmit
        }
        className="mt-7"
      >
        <label className="text-xs font-semibold text-[#A9B5C3]">
          Staff password
        </label>

        <input
          required
          autoFocus

          type="password"

          value={
            password
          }

          onChange={(
            event
          ) =>
            setPassword(
              event.target
                .value
            )
          }

          autoComplete="current-password"

          placeholder="Enter password"

          className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3.5 outline-none transition focus:border-[#0057FF]"
        />

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"

          disabled={
            submitting
          }

          className="mt-5 w-full rounded-xl bg-[#0057FF] px-5 py-3.5 font-semibold text-white transition hover:bg-[#2874FF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Signing in..."
            : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs leading-5 text-[#53687D]">
        Your session stays
        active for 12 hours.
      </p>
    </div>
  );
}