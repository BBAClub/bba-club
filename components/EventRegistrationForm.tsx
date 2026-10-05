"use client";

import {
  FormEvent,
  useState,
} from "react";

type EventRegistrationFormProps = {
  eventSlug: string;
  eventTitle: string;

  registrationStatus?:
    | "coming-soon"
    | "open"
    | "closed"
    | "full";

  capacity?: number;
};

type RegistrationResult = {
  status:
    | "confirmed"
    | "waitlist";

  eventTitle: string;

  ticketCode: string;

  waitlistPosition?: number;
};

type RegistrationApiResponse = {
  success?: boolean;

  status?:
    | "confirmed"
    | "waitlist";

  eventTitle?: string;

  ticketCode?: string;

  waitlistPosition?: number;

  error?: string;
};

export default function EventRegistrationForm({
  eventSlug,
  eventTitle,
  registrationStatus,
  capacity,
}: EventRegistrationFormProps) {
  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    result,
    setResult,
  ] = useState<
    RegistrationResult | null
  >(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    /*
      Data z formuláře převedeme
      na normální JSON.
    */

    const website =
      String(
        formData.get(
          "website"
        ) ?? ""
      );

    const firstName =
      String(
        formData.get(
          "firstName"
        ) ?? ""
      );

    const lastName =
      String(
        formData.get(
          "lastName"
        ) ?? ""
      );

    const email =
      String(
        formData.get(
          "email"
        ) ?? ""
      );

    const university =
      String(
        formData.get(
          "university"
        ) ?? ""
      );

    const note =
      String(
        formData.get(
          "note"
        ) ?? ""
      );

    try {
      const response =
        await fetch(
          "/api/event-registrations",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                eventSlug,

                firstName,

                lastName,

                email,

                university,

                note,

                website,
              }),
          }
        );

      /*
        Nejdřív čteme text.

        Pokud by server znovu
        vrátil něco jiného než JSON,
        dostaneme srozumitelnější
        chybu.
      */

      const responseText =
        await response.text();

      let data:
        RegistrationApiResponse;

      try {
        data =
          responseText
            ? JSON.parse(
                responseText
              )
            : {};
      } catch {
        console.error(
          "Non-JSON response from registration API:",
          responseText
        );

        throw new Error(
          "The registration server returned an unexpected response."
        );
      }

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ??
            `Registration failed (${response.status}).`
        );
      }

      if (
        !data.status ||
        !data.eventTitle ||
        !data.ticketCode
      ) {
        throw new Error(
          "The registration server returned incomplete data."
        );
      }

      setResult({
        status:
          data.status,

        eventTitle:
          data.eventTitle,

        ticketCode:
          data.ticketCode,

        waitlistPosition:
          data.waitlistPosition,
      });

      form.reset();
    } catch (
      submitError
    ) {
      console.error(
        "Registration submit error:",
        submitError
      );

      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Registration failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
    CLOSED
  */

  if (
    registrationStatus ===
    "closed"
  ) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-[#0D1D2C] p-6 md:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71869A]">
          Registration
        </p>

        <h2 className="mt-3 text-2xl font-semibold">
          Registration closed.
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#8EA0B3]">
          Registration for
          this event is no
          longer available.
        </p>
      </div>
    );
  }

  /*
    COMING SOON
  */

  if (
    registrationStatus ===
    "coming-soon"
  ) {
    return (
      <div className="rounded-[24px] border border-[#0057FF]/25 bg-[#0D2035] p-6 md:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
          Registration
        </p>

        <h2 className="mt-3 text-2xl font-semibold">
          Coming soon.
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#A9B5C3]">
          Registration for{" "}
          {eventTitle} has not
          opened yet.
        </p>
      </div>
    );
  }

  /*
    SUCCESS
  */

  if (result) {
    const confirmed =
      result.status ===
      "confirmed";

    return (
      <div className="rounded-[26px] border border-[#0057FF]/30 bg-[#0D2035] p-6 md:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0057FF] text-xl font-bold">
          {confirmed
            ? "✓"
            : "↗"}
        </div>

        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
          {confirmed
            ? "Registration confirmed"
            : "Waitlist"}
        </p>

        <h2 className="mt-2 text-2xl font-bold md:text-3xl">
          {confirmed
            ? "You're registered."
            : "You're on the waitlist."}
        </h2>

        <p className="mt-3 leading-7 text-[#A9B5C3]">
          {confirmed
            ? `Your place for ${result.eventTitle} has been reserved.`
            : `The event is currently full, but we've added you to the waitlist.`}
        </p>

        {!confirmed &&
          result.waitlistPosition && (
            <div className="mt-5 rounded-xl border border-white/10 bg-[#071422]/50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#71869A]">
                Waitlist
                position
              </p>

              <p className="mt-1 text-xl font-semibold">
                #
                {
                  result.waitlistPosition
                }
              </p>
            </div>
          )}

        {confirmed && (
          <div className="mt-5 rounded-xl border border-white/10 bg-[#071422]/50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71869A]">
              Ticket code
            </p>

            <p className="mt-2 break-all font-mono text-sm text-[#A9B5C3]">
              {
                result.ticketCode
              }
            </p>

            <p className="mt-2 text-xs leading-5 text-[#53687D]">
              You do not
              need to do
              anything with
              this code yet.
              It will later
              be used for
              your QR ticket.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setResult(null);
            setError(null);
          }}
          className="mt-6 text-sm font-medium text-[#5790FF] transition hover:text-[#8EC5FF]"
        >
          Register another
          person
        </button>
      </div>
    );
  }

  /*
    FORM
  */

  return (
    <div className="rounded-[26px] border border-white/10 bg-[#0D1D2C] p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
            Registration
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Join the event.
          </h2>
        </div>

        {registrationStatus ===
          "full" && (
          <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8EC5FF]">
            Waitlist
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-6 text-[#8EA0B3]">
        {registrationStatus ===
        "full"
          ? "The event is currently full. You can still register for the waitlist."
          : "Reserve your place for this event."}
      </p>

      {capacity && (
        <p className="mt-2 text-xs text-[#53687D]">
          Event capacity:{" "}
          {capacity}
        </p>
      )}

      <form
        onSubmit={
          handleSubmit
        }
        className="mt-7 space-y-5"
      >
        {/* HONEYPOT */}

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">
              First name *
            </span>

            <input
              required
              name="firstName"
              type="text"
              maxLength={100}
              autoComplete="given-name"
              placeholder="First name"
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Last name *
            </span>

            <input
              required
              name="lastName"
              type="text"
              maxLength={100}
              autoComplete="family-name"
              placeholder="Last name"
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">
            Email *
          </span>

          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">
            University /
            School
          </span>

          <input
            name="university"
            type="text"
            maxLength={150}
            placeholder="e.g. VŠE"
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">
            Note
          </span>

          <textarea
            name="note"
            rows={3}
            maxLength={1000}
            placeholder="Anything we should know? Optional."
            className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]"
          />
        </label>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={
            submitting
          }
          className="w-full rounded-xl bg-[#0057FF] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2874FF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Registering..."
            : registrationStatus ===
                "full"
              ? "Join the waitlist"
              : "Register for event"}
        </button>

        <p className="text-xs leading-5 text-[#53687D]">
          By registering,
          your information
          will be used by BBA
          Club to manage this
          event and attendance.
        </p>
      </form>
    </div>
  );
}