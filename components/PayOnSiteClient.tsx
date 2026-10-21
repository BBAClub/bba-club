"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

type PaymentStatus =
  | "not_required"
  | "pay_on_site"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

type Registration = {
  firstName?: string;
  lastName?: string;

  status?: string;

  paymentStatus?:
    PaymentStatus;

  paymentAmount?: number;

  paymentCurrency?:
    | "CZK"
    | "EUR";

  event?: {
    title?: string;

    date?: string;
    time?: string;

    venue?: string;
    location?: string;
    address?: string;
  };
};

type ApiResponse = {
  success?: boolean;

  error?: string;
  code?: string;

  alreadyConfirmed?:
    boolean;

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

function formatPrice(
  amount?: number,
  currency?: string
) {
  if (
    typeof amount !==
    "number"
  ) {
    return undefined;
  }

  if (
    currency === "EUR"
  ) {
    return `${amount} €`;
  }

  return `${amount} Kč`;
}

export default function PayOnSiteClient() {
  const searchParams =
    useSearchParams();

  const registrationId =
    searchParams.get("id") ??
    "";

  const paymentTransactionId =
    searchParams.get(
      "transaction"
    ) ?? "";

  const expiresAt =
    searchParams.get(
      "expires"
    ) ?? "";

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
    confirming,
    setConfirming,
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
    confirmed,
    setConfirmed,
  ] =
    useState(false);

  useEffect(() => {
    async function verify() {
      if (
        !registrationId ||
        !paymentTransactionId ||
        !expiresAt ||
        !token
      ) {
        setError(
          "This payment fallback link is incomplete."
        );

        setLoading(false);

        return;
      }

      try {
        const query =
          new URLSearchParams({
            id:
              registrationId,

            transaction:
              paymentTransactionId,

            expires:
              expiresAt,

            token,
          });

        const response =
          await fetch(
            `/api/event-registrations/pay-on-site?${query.toString()}`,
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
              "This payment fallback link is invalid."
          );

          return;
        }

        setRegistration(
          data.registration
        );

        if (
          data.registration.status ===
            "confirmed" &&
          data.registration.paymentStatus ===
            "pay_on_site"
        ) {
          setConfirmed(
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
    paymentTransactionId,
    expiresAt,
    token,
  ]);

  async function confirmPayOnSite() {
    if (
      confirming ||
      confirmed
    ) {
      return;
    }

    setConfirming(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/event-registrations/pay-on-site",
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

                paymentTransactionId,

                expiresAt,

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
            "Could not confirm payment at the venue."
        );

        return;
      }

      if (
        data.registration
      ) {
        setRegistration(
          data.registration
        );
      }

      setConfirmed(true);
    } catch {
      setError(
        "Could not confirm payment at the venue."
      );
    } finally {
      setConfirming(false);
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

  const event =
    registration.event;

  const venue =
    event?.venue ??
    event?.location;

  const formattedDate =
    formatDate(
      event?.date
    );

  const price =
    formatPrice(
      registration.paymentAmount,
      registration.paymentCurrency
    );

  if (confirmed) {
    return (
      <div className="mx-auto max-w-xl rounded-[26px] border border-white/10 bg-[#0D1D2C] p-7 md:p-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
          Registration confirmed
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] md:text-4xl">
          You're all set.
        </h1>

        <p className="mt-4 leading-7 text-[#A9B5C3]">
          Your place for{" "}
          <strong className="text-white">
            {event?.title}
          </strong>{" "}
          is confirmed.
        </p>

        <div className="mt-6 rounded-[20px] border border-amber-400/20 bg-amber-400/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-200">
            Payment at the venue
          </p>

          {price && (
            <p className="mt-2 text-2xl font-bold text-white">
              {price}
            </p>
          )}

          <p className="mt-2 text-sm leading-6 text-[#A9B5C3]">
            Please pay this amount to a
            BBA Club organizer when you
            arrive.
          </p>
        </div>

        <p className="mt-5 text-sm leading-6 text-[#8EA0B3]">
          Your ticket with QR code has
          been sent to your email.
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

  return (
    <div className="mx-auto max-w-xl rounded-[26px] border border-white/10 bg-[#0D1D2C] p-7 md:p-9">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
        Payment fallback
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] md:text-4xl">
        Pay at the venue?
      </h1>

      <p className="mt-4 leading-7 text-[#A9B5C3]">
        Your online payment was not
        completed. If you still want to
        attend, you can request to pay
        when you arrive.
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

        {price && (
          <p className="mt-4 text-xl font-bold text-white">
            {price}
          </p>
        )}
      </div>

      <p className="mt-6 text-sm leading-6 text-[#8EA0B3]">
        We will check that a place is
        still available before confirming
        your registration. Nothing is
        changed until you press the button
        below.
      </p>

      {error && (
        <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm leading-6 text-red-200">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={
          confirming
        }
        onClick={() =>
          void confirmPayOnSite()
        }
        className="mt-7 w-full rounded-xl bg-[#0057FF] px-5 py-3.5 font-semibold text-white transition hover:bg-[#2874FF] disabled:opacity-50"
      >
        {confirming
          ? "Confirming..."
          : "Confirm attendance & pay at the venue"}
      </button>

      <a
        href="/events"
        className="mt-4 block text-center text-sm text-[#71869A] transition hover:text-white"
      >
        Don't confirm
      </a>
    </div>
  );
}
