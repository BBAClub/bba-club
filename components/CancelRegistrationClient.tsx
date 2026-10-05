"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

type RegistrationStatus =
  | "confirmed"
  | "waitlist"
  | "cancelled"
  | "checked-in";

type Registration = {
  firstName?: string;
  lastName?: string;

  status?:
    RegistrationStatus;

  event?: {
    title?: string;

    date?: string;
    time?: string;

    venue?: string;
    location?: string;
  };
};

type ApiResponse = {
  success?: boolean;

  error?: string;

  alreadyCancelled?:
    boolean;

  promotedCount?:
    number;

  registration?:
    Registration;
};

function formatDate(
  value?: string
) {
  if (!value) {
    return undefined;
  }

  const parsed =
    new Date(
      `${value}T12:00:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(parsed);
}

export default function CancelRegistrationClient() {
  const searchParams =
    useSearchParams();

  const registrationId =
    searchParams.get("id") ??
    "";

  const token =
    searchParams.get(
      "token"
    ) ?? "";

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    cancelling,
    setCancelling,
  ] =
    useState(false);

  const [
    registration,
    setRegistration,
  ] =
    useState<
      Registration | null
    >(null);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    cancelled,
    setCancelled,
  ] =
    useState(false);

  useEffect(() => {
    async function verify() {
      if (
        !registrationId ||
        !token
      ) {
        setError(
          "This cancellation link is incomplete."
        );

        setLoading(false);

        return;
      }

      try {
        const query =
          new URLSearchParams({
            id:
              registrationId,

            token,
          });

        const response =
          await fetch(
            `/api/event-registrations/cancel?${query.toString()}`,
            {
              cache:
                "no-store",
            }
          );

        const data =
          (await response.json()) as
            ApiResponse;

        if (
          !response.ok ||
          !data.registration
        ) {
          setError(
            data.error ??
              "This cancellation link is invalid."
          );

          return;
        }

        setRegistration(
          data.registration
        );

        if (
          data.registration
            .status ===
          "cancelled"
        ) {
          setCancelled(
            true
          );
        }
      } catch {
        setError(
          "Could not load this registration."
        );
      } finally {
        setLoading(false);
      }
    }

    void verify();
  }, [
    registrationId,
    token,
  ]);

  async function cancelRegistration() {
    if (
      cancelling ||
      cancelled
    ) {
      return;
    }

    setCancelling(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/event-registrations/cancel",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                registrationId,

                token,
              }),
          }
        );

      const data =
        (await response.json()) as
          ApiResponse;

      if (!response.ok) {
        setError(
          data.error ??
            "Could not cancel your registration."
        );

        return;
      }

      setCancelled(true);

      setRegistration(
        (current) =>
          current
            ? {
                ...current,

                status:
                  "cancelled",
              }
            : current
      );
    } catch {
      setError(
        "Could not cancel your registration."
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl rounded-[26px] border border-white/10 bg-[#0D1D2C] p-7 text-center">
        <p className="text-[#8EA0B3]">
          Loading registration...
        </p>
      </div>
    );
  }

  if (
    error &&
    !registration
  ) {
    return (
      <div className="mx-auto max-w-xl rounded-[26px] border border-red-400/20 bg-[#0D1D2C] p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300">
          Invalid link
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em]">
          We couldn't open this registration.
        </h1>

        <p className="mt-4 leading-7 text-[#8EA0B3]">
          {error}
        </p>
      </div>
    );
  }

  if (!registration) {
    return null;
  }

  const name = [
    registration.firstName,
    registration.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const event =
    registration.event;

  const venue =
    event?.venue ??
    event?.location;

  const formattedDate =
    formatDate(
      event?.date
    );

  if (cancelled) {
    return (
      <div className="mx-auto max-w-xl rounded-[26px] border border-white/10 bg-[#0D1D2C] p-7 md:p-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
          Registration cancelled
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] md:text-4xl">
          Your spot has been released.
        </h1>

        <p className="mt-4 leading-7 text-[#A9B5C3]">
          Your registration for{" "}
          <strong className="text-white">
            {event?.title}
          </strong>{" "}
          has been cancelled.
        </p>

        <p className="mt-4 text-sm leading-6 text-[#71869A]">
          If the event had a waitlist,
          the next attendee may now
          automatically receive the
          available spot.
        </p>

        <a
          href="/events"
          className="mt-7 inline-flex rounded-xl bg-[#0057FF] px-5 py-3 font-semibold text-white transition hover:bg-[#2874FF]"
        >
          View events
        </a>
      </div>
    );
  }

  const cannotCancel =
    registration.status ===
    "checked-in";

  const isWaitlist =
    registration.status ===
    "waitlist";

  return (
    <div className="mx-auto max-w-xl rounded-[26px] border border-white/10 bg-[#0D1D2C] p-7 md:p-9">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
        BBA Club
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] md:text-4xl">
        {isWaitlist
          ? "Leave the waitlist?"
          : "Cancel your registration?"}
      </h1>

      <p className="mt-4 leading-7 text-[#A9B5C3]">
        {name
          ? `Hi ${name}. `
          : ""}

        {isWaitlist
          ? "You are currently on the waitlist for this event."
          : "You currently have a confirmed place for this event."}
      </p>

      <div className="mt-7 rounded-[20px] border border-white/10 bg-[#071422] p-5">
        <p className="font-semibold text-white">
          {event?.title}
        </p>

        {formattedDate && (
          <p className="mt-3 text-sm text-[#8EA0B3]">
            {formattedDate}
            {event?.time
              ? ` · ${event.time}`
              : ""}
          </p>
        )}

        {venue && (
          <p className="mt-1 text-sm text-[#71869A]">
            {venue}
          </p>
        )}
      </div>

      {cannotCancel ? (
        <div className="mt-6 rounded-xl border border-[#8EC5FF]/20 bg-[#0057FF]/10 p-4 text-sm leading-6 text-[#A9B5C3]">
          This ticket has already
          been checked in and can
          no longer be cancelled
          using this link.
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm leading-6 text-[#8EA0B3]">
            {isWaitlist
              ? "After leaving the waitlist, your position will be removed."
              : "Once cancelled, your spot may automatically be offered to the next person on the waitlist."}
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={
              cancelling
            }
            onClick={() =>
              void cancelRegistration()
            }
            className="mt-7 w-full rounded-xl border border-red-400/40 bg-red-400/10 px-5 py-3.5 font-semibold text-red-200 transition hover:bg-red-400/20 disabled:opacity-50"
          >
            {cancelling
              ? "Cancelling..."
              : isWaitlist
                ? "Yes, leave the waitlist"
                : "Yes, cancel my registration"}
          </button>
        </>
      )}

      <a
        href="/events"
        className="mt-4 block text-center text-sm text-[#71869A] transition hover:text-white"
      >
        Keep my registration
      </a>
    </div>
  );
}