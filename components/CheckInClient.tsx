"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import AdminLogoutButton from "@/components/AdminLogoutButton";

type RegistrationStatus =
  | "confirmed"
  | "waitlist"
  | "cancelled"
  | "checked-in";

type Registration = {
  _id: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  status?: RegistrationStatus;

  checkedInAt?: string;

  event?: {
    title?: string;
    date?: string;
    time?: string;
    location?: string;
    venue?: string;
  };
};

type ApiResponse = {
  success?: boolean;

  error?: string;

  code?: string;

  alreadyCheckedIn?: boolean;

  registration?: Registration;

  results?: Registration[];
};

type ScanResult = {
  type:
    | "success"
    | "already"
    | "error";

  message: string;

  registration?: Registration;
};

type Html5QrCodeInstance = {
  start: (
    camera:
      | string
      | {
          facingMode: string;
        },

    config: {
      fps: number;

      qrbox: {
        width: number;
        height: number;
      };
    },

    onSuccess: (
      decodedText: string
    ) => void,

    onError?: (
      errorMessage: string
    ) => void
  ) => Promise<void>;

  stop: () => Promise<void>;

  clear: () => Promise<void>;
};

function fullName(
  registration: Registration
) {
  return [
    registration.firstName,
    registration.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function statusLabel(
  status?: RegistrationStatus
) {
  switch (status) {
    case "confirmed":
      return "Confirmed";

    case "waitlist":
      return "Waitlist";

    case "cancelled":
      return "Cancelled";

    case "checked-in":
      return "Checked in";

    default:
      return "Unknown";
  }
}

export default function CheckInClient() {
  const [
    scannerRunning,
    setScannerRunning,
  ] =
    useState(false);

  const [
    scannerStarting,
    setScannerStarting,
  ] =
    useState(false);

  const [
    result,
    setResult,
  ] =
    useState<
      ScanResult | null
    >(null);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    searching,
    setSearching,
  ] =
    useState(false);

  const [
    searchResults,
    setSearchResults,
  ] =
    useState<
      Registration[]
    >([]);

  const [
    manualProcessing,
    setManualProcessing,
  ] =
    useState<
      string | null
    >(null);

  const scannerRef =
    useRef<
      Html5QrCodeInstance | null
    >(null);

  const scanLockRef =
    useRef(false);

  async function callApi(
    payload:
      Record<
        string,
        unknown
      >
  ) {
    const response =
      await fetch(
        "/api/check-in",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const data =
      (await response.json()) as
        ApiResponse;

    if (
      response.status ===
      401
    ) {
      window.location.href =
        "/admin/login?next=/check-in";
    }

    return {
      response,
      data,
    };
  }

  async function checkInTicket(
    ticket: string
  ) {
    const {
      response,
      data,
    } =
      await callApi({
        action: "check-in",
        ticket,
      });

    if (
      response.ok &&
      data.registration
    ) {
      if (
        data.alreadyCheckedIn
      ) {
        setResult({
          type: "already",

          message:
            "Already checked in.",

          registration:
            data.registration,
        });
      } else {
        setResult({
          type: "success",

          message:
            "Checked in successfully.",

          registration:
            data.registration,
        });
      }

      return;
    }

    setResult({
      type: "error",

      message:
        data.error ??
        "Invalid ticket.",

      registration:
        data.registration,
    });
  }

  async function stopScanner() {
    const scanner =
      scannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      await scanner.stop();
    } catch {
      // Already stopped.
    }

    try {
      await scanner.clear();
    } catch {
      // Ignore cleanup errors.
    }

    scannerRef.current =
      null;

    setScannerRunning(
      false
    );
  }

  async function startScanner() {
    if (
      scannerRunning ||
      scannerStarting
    ) {
      return;
    }

    setResult(null);

    setScannerStarting(
      true
    );

    try {
      const {
        Html5Qrcode,
      } =
        await import(
          "html5-qrcode"
        );

      const scanner =
        new Html5Qrcode(
          "qr-reader"
        ) as unknown as
          Html5QrCodeInstance;

      scannerRef.current =
        scanner;

      await scanner.start(
        {
          facingMode:
            "environment",
        },

        {
          fps: 10,

          qrbox: {
            width: 250,
            height: 250,
          },
        },

        async (
          decodedText
        ) => {
          if (
            scanLockRef.current
          ) {
            return;
          }

          scanLockRef.current =
            true;

          await stopScanner();

          await checkInTicket(
            decodedText
          );

          window.setTimeout(
            () => {
              scanLockRef.current =
                false;
            },
            1200
          );
        },

        () => {
          // Ignore frames without QR.
        }
      );

      setScannerRunning(
        true
      );
    } catch (error) {
      console.error(
        "QR scanner error:",
        error
      );

      setResult({
        type: "error",

        message:
          "Could not start the camera. Check camera permission and try again.",
      });

      await stopScanner();
    } finally {
      setScannerStarting(
        false
      );
    }
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  async function handleSearch(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      search.trim().length <
      2
    ) {
      return;
    }

    setSearching(true);
    setResult(null);

    try {
      const {
        response,
        data,
      } =
        await callApi({
          action: "search",
          query: search,
        });

      if (!response.ok) {
        setResult({
          type: "error",

          message:
            data.error ??
            "Search failed.",
        });

        return;
      }

      setSearchResults(
        data.results ?? []
      );
    } finally {
      setSearching(false);
    }
  }

  async function manualCheckIn(
    registrationId: string
  ) {
    setManualProcessing(
      registrationId
    );

    try {
      const {
        response,
        data,
      } =
        await callApi({
          action: "check-in",

          registrationId,
        });

      if (
        response.ok &&
        data.registration
      ) {
        setResult({
          type:
            data.alreadyCheckedIn
              ? "already"
              : "success",

          message:
            data.alreadyCheckedIn
              ? "Already checked in."
              : "Checked in successfully.",

          registration:
            data.registration,
        });

        setSearchResults(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                registrationId
                  ? data.registration!
                  : item
            )
        );

        return;
      }

      setResult({
        type: "error",

        message:
          data.error ??
          "Check-in failed.",

        registration:
          data.registration,
      });
    } finally {
      setManualProcessing(
        null
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
            BBA Club staff
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
            Event check-in
          </h1>
        </div>

        <div className="flex gap-2">
          <a
            href="/admin/events"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-[#A9B5C3] transition hover:bg-white/5 hover:text-white"
          >
            Dashboard
          </a>

          <AdminLogoutButton />
        </div>
      </div>

      <section className="mt-8 rounded-[26px] border border-white/10 bg-[#0D1D2C] p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
              QR scanner
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Scan attendee ticket
            </h2>
          </div>

          {!scannerRunning ? (
            <button
              type="button"

              disabled={
                scannerStarting
              }

              onClick={() =>
                void startScanner()
              }

              className="rounded-xl bg-[#0057FF] px-5 py-3 text-sm font-semibold transition hover:bg-[#2874FF] disabled:opacity-60"
            >
              {scannerStarting
                ? "Opening camera..."
                : "Open camera"}
            </button>
          ) : (
            <button
              type="button"

              onClick={() =>
                void stopScanner()
              }

              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold"
            >
              Stop camera
            </button>
          )}
        </div>

        <div
          id="qr-reader"
          className="mt-5 overflow-hidden rounded-2xl"
        />
      </section>

      {result && (
        <section
          className={`mt-5 rounded-[24px] border p-6 ${
            result.type ===
            "success"
              ? "border-emerald-400/30 bg-emerald-400/10"
              : result.type ===
                  "already"
                ? "border-[#8EC5FF]/30 bg-[#0057FF]/10"
                : "border-red-400/30 bg-red-400/10"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
            {result.type ===
            "success"
              ? "✓ Checked in"
              : result.type ===
                  "already"
                ? "Already checked in"
                : "Check-in blocked"}
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {result.registration
              ? fullName(
                  result.registration
                )
              : result.message}
          </h2>

          {result.registration && (
            <>
              <p className="mt-2 text-sm opacity-80">
                {
                  result.registration
                    .event?.title
                }
              </p>

              <p className="mt-1 text-sm opacity-60">
                {
                  result.registration
                    .email
                }
              </p>

              {result.type ===
                "error" && (
                <p className="mt-4 font-medium">
                  {
                    result.message
                  }
                </p>
              )}
            </>
          )}

          <button
            type="button"

            onClick={() => {
              setResult(null);

              void startScanner();
            }}

            className="mt-5 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold"
          >
            Scan next ticket
          </button>
        </section>
      )}

      <section className="mt-5 rounded-[26px] border border-white/10 bg-[#0D1D2C] p-5 md:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
          Manual fallback
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Find attendee
        </h2>

        <p className="mt-2 text-sm text-[#8EA0B3]">
          Search by name or
          email if the attendee
          cannot show their QR
          ticket.
        </p>

        <form
          onSubmit={
            handleSearch
          }

          className="mt-5 flex gap-2"
        >
          <input
            value={search}

            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }

            placeholder="Name or email"

            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#071422] px-4 py-3 outline-none focus:border-[#0057FF]"
          />

          <button
            type="submit"

            disabled={
              searching
            }

            className="rounded-xl bg-[#0057FF] px-5 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {searching
              ? "Searching..."
              : "Search"}
          </button>
        </form>

        {searchResults.length >
          0 && (
          <div className="mt-5 space-y-2">
            {searchResults.map(
              (
                registration
              ) => (
                <div
                  key={
                    registration._id
                  }

                  className="flex flex-col gap-4 rounded-[18px] border border-white/10 bg-[#071422] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {fullName(
                        registration
                      )}
                    </p>

                    <p className="mt-1 text-sm text-[#8EA0B3]">
                      {
                        registration.email
                      }
                    </p>

                    <p className="mt-1 text-xs text-[#53687D]">
                      {
                        registration
                          .event
                          ?.title
                      }{" "}
                      ·{" "}
                      {statusLabel(
                        registration.status
                      )}
                    </p>
                  </div>

                  <button
                    type="button"

                    disabled={
                      manualProcessing ===
                        registration._id ||
                      registration.status ===
                        "waitlist" ||
                      registration.status ===
                        "cancelled"
                    }

                    onClick={() =>
                      void manualCheckIn(
                        registration._id
                      )
                    }

                    className="rounded-xl bg-[#0057FF] px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {registration.status ===
                    "checked-in"
                      ? "Already checked in"
                      : manualProcessing ===
                          registration._id
                        ? "Checking in..."
                        : "Check in"}
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}