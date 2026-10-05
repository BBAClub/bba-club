"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import AdminLogoutButton from "@/components/AdminLogoutButton";

type RegistrationStatus =
  | "confirmed"
  | "waitlist"
  | "cancelled"
  | "checked-in";

type AdminAction =
  | "confirm"
  | "waitlist"
  | "cancel"
  | "check-in"
  | "undo-check-in";

type EventStats = {
  confirmed: number;
  waitlist: number;
  checkedIn: number;
  cancelled: number;

  occupied: number;

  remaining:
    | number
    | null;
};

type EventSummary = {
  _id: string;

  title?: string;
  slug?: string;

  date?: string;
  time?: string;

  venue?: string;
  location?: string;

  capacity?: number;

  registrationStatus?:
    | "coming-soon"
    | "open"
    | "closed"
    | "full";

  stats:
    EventStats;
};

type Registration = {
  _id: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  university?: string;

  status?:
    RegistrationStatus;

  registeredAt?: string;
  checkedInAt?: string;
};

type OverviewResponse = {
  success?: boolean;

  error?: string;

  events?:
    EventSummary[];
};

type EventResponse = {
  success?: boolean;

  error?: string;

  event?:
    EventSummary;

  registrations?:
    Registration[];
};

type ManagementResponse = {
  success?: boolean;

  error?: string;

  promoted?: {
    _id: string;

    firstName?: string;
    lastName?: string;
    email?: string;
  }[];
};

type StatusFilter =
  | "all"
  | RegistrationStatus;

function fullName(
  registration:
    Registration
) {
  return [
    registration.firstName,
    registration.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatEventDate(
  value?: string
) {
  if (!value) {
    return "Date TBA";
  }

  const date =
    new Date(
      `${value}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatDateTime(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function statusLabel(
  status?:
    RegistrationStatus
) {
  switch (status) {
    case "confirmed":
      return "Confirmed";

    case "waitlist":
      return "Waitlist";

    case "checked-in":
      return "Checked in";

    case "cancelled":
      return "Cancelled";

    default:
      return "Unknown";
  }
}

function statusClass(
  status?:
    RegistrationStatus
) {
  switch (status) {
    case "confirmed":
      return "border-[#0057FF]/30 bg-[#0057FF]/10 text-[#8EC5FF]";

    case "waitlist":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";

    case "checked-in":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";

    case "cancelled":
      return "border-red-400/20 bg-red-400/10 text-red-200";

    default:
      return "border-white/10 bg-white/5 text-[#8EA0B3]";
  }
}

function sortEvents(
  events:
    EventSummary[]
) {
  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  return [
    ...events,
  ].sort(
    (a, b) => {
      const aDate =
        a.date ??
        "9999-12-31";

      const bDate =
        b.date ??
        "9999-12-31";

      const aPast =
        aDate < today;

      const bPast =
        bDate < today;

      if (
        aPast !==
        bPast
      ) {
        return aPast
          ? 1
          : -1;
      }

      if (aPast) {
        return bDate.localeCompare(
          aDate
        );
      }

      return aDate.localeCompare(
        bDate
      );
    }
  );
}

function csvCell(
  value:
    | string
    | number
    | undefined
    | null
) {
  let text =
    String(
      value ?? ""
    );

  /*
    Prevent spreadsheet formula
    injection from user-entered
    content.
  */

  if (
    /^[=+\-@]/.test(
      text
    )
  ) {
    text =
      `'${text}`;
  }

  return `"${text.replaceAll(
    '"',
    '""'
  )}"`;
}

export default function EventDashboardClient() {
  const [
    events,
    setEvents,
  ] =
    useState<
      EventSummary[]
    >([]);

  const [
    selectedEventId,
    setSelectedEventId,
  ] =
    useState("");

  const [
    registrations,
    setRegistrations,
  ] =
    useState<
      Registration[]
    >([]);

  const [
    loadingOverview,
    setLoadingOverview,
  ] =
    useState(false);

  const [
    loadingEvent,
    setLoadingEvent,
  ] =
    useState(false);

  const [
    initialLoading,
    setInitialLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      StatusFilter
    >("all");

  /*
    SELECTED ATTENDEE
  */

  const [
    selectedRegistration,
    setSelectedRegistration,
  ] =
    useState<
      Registration | null
    >(null);

  const [
    managementAction,
    setManagementAction,
  ] =
    useState<
      AdminAction | null
    >(null);

  const [
    managementError,
    setManagementError,
  ] =
    useState<
      string | null
    >(null);

  const selectedEvent =
    events.find(
      (event) =>
        event._id ===
        selectedEventId
    );

  /*
    DASHBOARD API

    Authentication now happens
    through the HttpOnly cookie.
  */

  async function dashboardApi<
    T,
  >(
    payload:
      Record<
        string,
        unknown
      >
  ) {
    const response =
      await fetch(
        "/api/event-dashboard",
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
        T;

    if (
      response.status ===
      401
    ) {
      window.location.href =
        "/admin/login?next=/admin/events";
    }

    return {
      response,
      data,
    };
  }

  /*
    LOAD ONE EVENT
  */

  async function loadEvent(
    eventId: string
  ) {
    if (!eventId) {
      return;
    }

    setLoadingEvent(
      true
    );

    setError(null);

    try {
      const {
        response,
        data,
      } =
        await dashboardApi<
          EventResponse
        >({
          action: "event",
          eventId,
        });

      if (!response.ok) {
        setError(
          data.error ??
            "Could not load event."
        );

        return;
      }

      setRegistrations(
        data.registrations ??
          []
      );
    } catch (error) {
      console.error(
        "Load event error:",
        error
      );

      setError(
        "Could not load event."
      );
    } finally {
      setLoadingEvent(
        false
      );
    }
  }

  /*
    LOAD OVERVIEW

    preferredEventId keeps us
    on the current event after
    actions such as check-in or
    cancellation.
  */

  async function loadOverview(
    preferredEventId?:
      string
  ) {
    setLoadingOverview(
      true
    );

    setError(null);

    try {
      const {
        response,
        data,
      } =
        await dashboardApi<
          OverviewResponse
        >({
          action:
            "overview",
        });

      if (!response.ok) {
        setError(
          data.error ??
            "Could not load dashboard."
        );

        return false;
      }

      const sorted =
        sortEvents(
          data.events ??
            []
        );

      setEvents(
        sorted
      );

      if (
        sorted.length ===
        0
      ) {
        setSelectedEventId(
          ""
        );

        setRegistrations(
          []
        );

        return true;
      }

      const desiredEventId =
        preferredEventId ??
        selectedEventId;

      const nextEventId =
        desiredEventId &&
        sorted.some(
          (event) =>
            event._id ===
            desiredEventId
        )
          ? desiredEventId
          : sorted[0]._id;

      setSelectedEventId(
        nextEventId
      );

      await loadEvent(
        nextEventId
      );

      return true;
    } catch (error) {
      console.error(
        "Load dashboard error:",
        error
      );

      setError(
        "Could not load dashboard."
      );

      return false;
    } finally {
      setLoadingOverview(
        false
      );
    }
  }

  /*
    INITIAL LOAD

    The server page already checks
    authentication before rendering.
  */

  useEffect(() => {
    void (
      async () => {
        await loadOverview();

        setInitialLoading(
          false
        );
      }
    )();
  }, []);

  /*
    CHANGE EVENT
  */

  async function changeEvent(
    eventId: string
  ) {
    setSelectedEventId(
      eventId
    );

    setSearch("");

    setStatusFilter(
      "all"
    );

    setSelectedRegistration(
      null
    );

    await loadEvent(
      eventId
    );
  }

  /*
    ATTENDEE MANAGEMENT
  */

  async function manageRegistration(
    action:
      AdminAction
  ) {
    if (
      !selectedRegistration ||
      managementAction
    ) {
      return;
    }

    setManagementAction(
      action
    );

    setManagementError(
      null
    );

    try {
      const response =
        await fetch(
          "/api/event-registrations/manage",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                registrationId:
                  selectedRegistration._id,

                action,
              }),
          }
        );

      const data =
        (await response.json()) as
          ManagementResponse;

      if (
        response.status ===
        401
      ) {
        window.location.href =
          "/admin/login?next=/admin/events";

        return;
      }

      if (!response.ok) {
        setManagementError(
          data.error ??
            "Could not update registration."
        );

        return;
      }

      setSelectedRegistration(
        null
      );

      /*
        Reload both event stats
        and registration list.
      */

      await loadOverview(
        selectedEventId
      );

      /*
        If somebody was promoted
        from the waitlist, inform
        the staff member.
      */

      if (
        data.promoted &&
        data.promoted.length >
          0
      ) {
        const names =
          data.promoted
            .map(
              (
                person
              ) =>
                [
                  person.firstName,
                  person.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")
            )
            .filter(Boolean)
            .join(", ");

        window.alert(
          `${data.promoted.length} waitlisted attendee${
            data.promoted.length ===
            1
              ? ""
              : "s"
          } automatically confirmed${
            names
              ? `: ${names}`
              : "."
          }`
        );
      }
    } catch (error) {
      console.error(
        "Dashboard registration management error:",
        error
      );

      setManagementError(
        "Could not update registration."
      );
    } finally {
      setManagementAction(
        null
      );
    }
  }

  /*
    SEARCH + FILTERS
  */

  const filteredRegistrations =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return registrations.filter(
        (
          registration
        ) => {
          if (
            statusFilter !==
              "all" &&
            registration.status !==
              statusFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const haystack = [
            registration.firstName,
            registration.lastName,
            registration.email,
            registration.university,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            query
          );
        }
      );
    }, [
      registrations,
      search,
      statusFilter,
    ]);

  /*
    CSV EXPORT
  */

  function exportCsv() {
    if (
      !selectedEvent
    ) {
      return;
    }

    const rows = [
      [
        "First name",
        "Last name",
        "Email",
        "University",
        "Status",
        "Registered at",
        "Checked in at",
      ],

      ...filteredRegistrations.map(
        (
          registration
        ) => [
          registration.firstName ??
            "",

          registration.lastName ??
            "",

          registration.email ??
            "",

          registration.university ??
            "",

          statusLabel(
            registration.status
          ),

          registration.registeredAt ??
            "",

          registration.checkedInAt ??
            "",
        ]
      ),
    ];

    const csv =
      rows
        .map(
          (row) =>
            row
              .map(
                csvCell
              )
              .join(",")
        )
        .join("\n");

    const blob =
      new Blob(
        [
          "\uFEFF",
          csv,
        ],
        {
          type:
            "text/csv;charset=utf-8",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    const safeTitle =
      (
        selectedEvent.title ??
        "event"
      )
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        );

    anchor.href =
      url;

    anchor.download =
      `${safeTitle}-attendees.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(
      url
    );
  }

  /*
    INITIAL LOADING
  */

  if (initialLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[26px] border border-white/10 bg-[#0D1D2C] p-10 text-center">
          <p className="text-sm text-[#71869A]">
            Loading event dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
              BBA Club staff
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] md:text-5xl">
              Event dashboard
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#8EA0B3]">
              Registrations,
              attendance and
              capacity in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/check-in"
              className="rounded-xl bg-[#0057FF] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#2874FF]"
            >
              Open check-in
            </Link>

            <button
              type="button"
              disabled={
                loadingOverview
              }
              onClick={() =>
                void loadOverview(
                  selectedEventId
                )
              }
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-[#A9B5C3] transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              {loadingOverview
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <AdminLogoutButton />
          </div>
        </div>

        {/* NO EVENTS */}

        {events.length === 0 ? (
          <section className="mt-9 rounded-[26px] border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
            <p className="text-lg font-semibold">
              No events found.
            </p>

            <p className="mt-2 text-sm text-[#71869A]">
              Create an event in
              Sanity Studio and it
              will appear here.
            </p>
          </section>
        ) : (
          <>
            {/* EVENT SELECTOR */}

            <section className="mt-9 rounded-[24px] border border-white/10 bg-[#0D1D2C] p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
                    Event
                  </p>

                  <p className="mt-1 text-sm text-[#8EA0B3]">
                    Choose the
                    event you want
                    to manage.
                  </p>
                </div>

                <select
                  value={
                    selectedEventId
                  }
                  onChange={(
                    event
                  ) =>
                    void changeEvent(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm outline-none focus:border-[#0057FF] md:w-auto md:min-w-[320px]"
                >
                  {events.map(
                    (event) => (
                      <option
                        key={
                          event._id
                        }
                        value={
                          event._id
                        }
                      >
                        {event.title ??
                          "Untitled event"}{" "}
                        —{" "}
                        {formatEventDate(
                          event.date
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </section>

            {selectedEvent && (
              <>
                {/* EVENT INFO */}

                <section className="mt-5 rounded-[26px] border border-white/10 bg-[#0B1A29] p-6 md:p-8">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8EC5FF]">
                        {selectedEvent.registrationStatus ??
                          "Unknown"}
                      </span>

                      <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">
                        {
                          selectedEvent.title
                        }
                      </h2>

                      <p className="mt-3 text-sm text-[#8EA0B3]">
                        {formatEventDate(
                          selectedEvent.date
                        )}

                        {selectedEvent.time
                          ? ` · ${selectedEvent.time}`
                          : ""}

                        {selectedEvent.venue ||
                        selectedEvent.location
                          ? ` · ${
                              selectedEvent.venue ??
                              selectedEvent.location
                            }`
                          : ""}
                      </p>
                    </div>

                    {selectedEvent.slug && (
                      <Link
                        href={`/events/${selectedEvent.slug}`}
                        target="_blank"
                        className="text-sm font-semibold text-[#5790FF] transition hover:text-white"
                      >
                        View public
                        page →
                      </Link>
                    )}
                  </div>

                  {/* STATS */}

                  <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-[18px] border border-white/10 bg-[#071422] p-4 md:p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71869A]">
                        Registered
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {
                          selectedEvent
                            .stats
                            .occupied
                        }

                        {typeof selectedEvent.capacity ===
                          "number" && (
                          <span className="text-lg font-normal text-[#53687D]">
                            {" "}
                            /{" "}
                            {
                              selectedEvent.capacity
                            }
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-[#071422] p-4 md:p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71869A]">
                        Waitlist
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {
                          selectedEvent
                            .stats
                            .waitlist
                        }
                      </p>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-[#071422] p-4 md:p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71869A]">
                        Checked in
                      </p>

                      <p className="mt-2 text-3xl font-bold text-emerald-200">
                        {
                          selectedEvent
                            .stats
                            .checkedIn
                        }
                      </p>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-[#071422] p-4 md:p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71869A]">
                        Remaining
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {selectedEvent
                          .stats
                          .remaining ??
                          "∞"}
                      </p>
                    </div>
                  </div>

                  {/* CAPACITY BAR */}

                  {typeof selectedEvent.capacity ===
                    "number" &&
                    selectedEvent.capacity >
                      0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between gap-3 text-xs text-[#71869A]">
                          <span>
                            Capacity
                          </span>

                          <span>
                            {
                              selectedEvent
                                .stats
                                .occupied
                            }{" "}
                            /{" "}
                            {
                              selectedEvent.capacity
                            }
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-[#0057FF] transition-all"
                            style={{
                              width: `${Math.min(
                                (
                                  selectedEvent
                                    .stats
                                    .occupied /
                                  selectedEvent.capacity
                                ) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                </section>

                {/* REGISTRATIONS */}

                <section className="mt-5 rounded-[26px] border border-white/10 bg-[#0D1D2C] p-5 md:p-7">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
                        Attendees
                      </p>

                      <h2 className="mt-2 text-2xl font-semibold">
                        Registrations
                      </h2>

                      <p className="mt-2 text-sm text-[#71869A]">
                        Click an
                        attendee to
                        manage their
                        registration.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        exportCsv
                      }
                      disabled={
                        filteredRegistrations.length ===
                        0
                      }
                      className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-[#A9B5C3] transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                    >
                      Export CSV
                    </button>
                  </div>

                  {/* SEARCH */}

                  <div className="mt-6">
                    <input
                      value={
                        search
                      }
                      onChange={(
                        event
                      ) =>
                        setSearch(
                          event.target
                            .value
                        )
                      }
                      placeholder="Search name, email or university..."
                      className="w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 outline-none focus:border-[#0057FF]"
                    />
                  </div>

                  {/* FILTERS */}

                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {(
                      [
                        [
                          "all",
                          "All",
                        ],

                        [
                          "confirmed",
                          "Confirmed",
                        ],

                        [
                          "waitlist",
                          "Waitlist",
                        ],

                        [
                          "checked-in",
                          "Checked in",
                        ],

                        [
                          "cancelled",
                          "Cancelled",
                        ],
                      ] as [
                        StatusFilter,
                        string,
                      ][]
                    ).map(
                      ([
                        value,
                        label,
                      ]) => (
                        <button
                          key={
                            value
                          }
                          type="button"
                          onClick={() =>
                            setStatusFilter(
                              value
                            )
                          }
                          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                            statusFilter ===
                            value
                              ? "bg-[#0057FF] text-white"
                              : "border border-white/10 bg-white/[0.03] text-[#8EA0B3] hover:bg-white/5"
                          }`}
                        >
                          {
                            label
                          }
                        </button>
                      )
                    )}
                  </div>

                  {/* REGISTRATION LIST */}

                  {loadingEvent ? (
                    <div className="py-14 text-center text-[#71869A]">
                      Loading
                      registrations...
                    </div>
                  ) : filteredRegistrations.length ===
                    0 ? (
                    <div className="mt-6 rounded-[18px] border border-dashed border-white/10 p-8 text-center text-sm text-[#71869A]">
                      No
                      registrations
                      match this
                      filter.
                    </div>
                  ) : (
                    <>
                      {/* MOBILE */}

                      <div className="mt-6 space-y-2 md:hidden">
                        {filteredRegistrations.map(
                          (
                            registration
                          ) => (
                            <button
                              key={
                                registration._id
                              }
                              type="button"
                              onClick={() => {
                                setManagementError(
                                  null
                                );

                                setSelectedRegistration(
                                  registration
                                );
                              }}
                              className="w-full rounded-[18px] border border-white/10 bg-[#071422] p-4 text-left transition hover:border-[#0057FF]/40 hover:bg-[#0B1A29]"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold">
                                    {fullName(
                                      registration
                                    ) ||
                                      "Unnamed attendee"}
                                  </p>

                                  <p className="mt-1 truncate text-sm text-[#8EA0B3]">
                                    {
                                      registration.email
                                    }
                                  </p>
                                </div>

                                <span
                                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${statusClass(
                                    registration.status
                                  )}`}
                                >
                                  {statusLabel(
                                    registration.status
                                  )}
                                </span>
                              </div>

                              {registration.university && (
                                <p className="mt-3 text-xs text-[#71869A]">
                                  {
                                    registration.university
                                  }
                                </p>
                              )}

                              <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-3 text-[11px] text-[#53687D]">
                                <span>
                                  Registered{" "}
                                  {formatDateTime(
                                    registration.registeredAt
                                  )}
                                </span>

                                {registration.checkedInAt && (
                                  <span>
                                    Check-in{" "}
                                    {formatDateTime(
                                      registration.checkedInAt
                                    )}
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        )}
                      </div>

                      {/* DESKTOP */}

                      <div className="mt-6 hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[850px] text-left">
                          <thead>
                            <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.12em] text-[#53687D]">
                              <th className="px-3 py-3 font-semibold">
                                Attendee
                              </th>

                              <th className="px-3 py-3 font-semibold">
                                University
                              </th>

                              <th className="px-3 py-3 font-semibold">
                                Status
                              </th>

                              <th className="px-3 py-3 font-semibold">
                                Registered
                              </th>

                              <th className="px-3 py-3 font-semibold">
                                Check-in
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredRegistrations.map(
                              (
                                registration
                              ) => (
                                <tr
                                  key={
                                    registration._id
                                  }
                                  onClick={() => {
                                    setManagementError(
                                      null
                                    );

                                    setSelectedRegistration(
                                      registration
                                    );
                                  }}
                                  className="cursor-pointer border-b border-white/[0.06] transition hover:bg-white/[0.03] last:border-0"
                                >
                                  <td className="px-3 py-4">
                                    <p className="font-semibold">
                                      {fullName(
                                        registration
                                      ) ||
                                        "Unnamed attendee"}
                                    </p>

                                    <p className="mt-1 text-xs text-[#71869A]">
                                      {
                                        registration.email
                                      }
                                    </p>
                                  </td>

                                  <td className="px-3 py-4 text-sm text-[#A9B5C3]">
                                    {registration.university ??
                                      "—"}
                                  </td>

                                  <td className="px-3 py-4">
                                    <span
                                      className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${statusClass(
                                        registration.status
                                      )}`}
                                    >
                                      {statusLabel(
                                        registration.status
                                      )}
                                    </span>
                                  </td>

                                  <td className="px-3 py-4 text-xs text-[#71869A]">
                                    {formatDateTime(
                                      registration.registeredAt
                                    )}
                                  </td>

                                  <td className="px-3 py-4 text-xs text-[#71869A]">
                                    {formatDateTime(
                                      registration.checkedInAt
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  <p className="mt-5 text-xs text-[#53687D]">
                    Showing{" "}
                    {
                      filteredRegistrations.length
                    }{" "}
                    of{" "}
                    {
                      registrations.length
                    }{" "}
                    registrations.
                  </p>
                </section>
              </>
            )}
          </>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>

      {/* ATTENDEE MODAL */}

      {selectedRegistration && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-6"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
                event.currentTarget &&
              !managementAction
            ) {
              setSelectedRegistration(
                null
              );
            }
          }}
        >
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0D1D2C] p-6 shadow-2xl md:max-w-lg md:rounded-[28px] md:p-7">
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
                  Attendee
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
                  {fullName(
                    selectedRegistration
                  ) ||
                    "Unnamed attendee"}
                </h2>

                <p className="mt-2 break-all text-sm text-[#8EA0B3]">
                  {
                    selectedRegistration.email
                  }
                </p>
              </div>

              <button
                type="button"
                disabled={
                  managementAction !==
                  null
                }
                onClick={() =>
                  setSelectedRegistration(
                    null
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-[#8EA0B3] transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                ×
              </button>
            </div>

            {/* DETAILS */}

            <div className="mt-6 rounded-[18px] border border-white/10 bg-[#071422] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#71869A]">
                  Status
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${statusClass(
                    selectedRegistration.status
                  )}`}
                >
                  {statusLabel(
                    selectedRegistration.status
                  )}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-xs text-[#71869A]">
                  Event
                </span>

                <span className="text-right text-sm text-[#A9B5C3]">
                  {selectedEvent?.title ??
                    "—"}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-xs text-[#71869A]">
                  University
                </span>

                <span className="text-right text-sm text-[#A9B5C3]">
                  {selectedRegistration.university ??
                    "—"}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-xs text-[#71869A]">
                  Registered
                </span>

                <span className="text-right text-sm text-[#A9B5C3]">
                  {formatDateTime(
                    selectedRegistration.registeredAt
                  )}
                </span>
              </div>

              {selectedRegistration.checkedInAt && (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <span className="text-xs text-[#71869A]">
                    Checked in
                  </span>

                  <span className="text-right text-sm text-[#A9B5C3]">
                    {formatDateTime(
                      selectedRegistration.checkedInAt
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* MANAGEMENT ERROR */}

            {managementError && (
              <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
                {
                  managementError
                }
              </div>
            )}

            {/* ACTIONS */}

            <div className="mt-6 space-y-2">
              {/* CONFIRM */}

              {(selectedRegistration.status ===
                "waitlist" ||
                selectedRegistration.status ===
                  "cancelled") && (
                <button
                  type="button"
                  disabled={
                    managementAction !==
                    null
                  }
                  onClick={() =>
                    void manageRegistration(
                      "confirm"
                    )
                  }
                  className="w-full rounded-xl bg-emerald-400 px-5 py-3.5 font-semibold text-[#071422] transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {managementAction ===
                  "confirm"
                    ? "Confirming..."
                    : "Confirm spot"}
                </button>
              )}

              {/* CHECK IN */}

              {selectedRegistration.status ===
                "confirmed" && (
                <button
                  type="button"
                  disabled={
                    managementAction !==
                    null
                  }
                  onClick={() =>
                    void manageRegistration(
                      "check-in"
                    )
                  }
                  className="w-full rounded-xl bg-[#0057FF] px-5 py-3.5 font-semibold text-white transition hover:bg-[#2874FF] disabled:opacity-50"
                >
                  {managementAction ===
                  "check-in"
                    ? "Checking in..."
                    : "Check in"}
                </button>
              )}

              {/* UNDO CHECK IN */}

              {selectedRegistration.status ===
                "checked-in" && (
                <button
                  type="button"
                  disabled={
                    managementAction !==
                    null
                  }
                  onClick={() =>
                    void manageRegistration(
                      "undo-check-in"
                    )
                  }
                  className="w-full rounded-xl border border-white/15 px-5 py-3.5 font-semibold text-[#A9B5C3] transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  {managementAction ===
                  "undo-check-in"
                    ? "Updating..."
                    : "Undo check-in"}
                </button>
              )}

              {/* WAITLIST */}

              {(selectedRegistration.status ===
                "confirmed" ||
                selectedRegistration.status ===
                  "cancelled") && (
                <button
                  type="button"
                  disabled={
                    managementAction !==
                    null
                  }
                  onClick={() => {
                    const confirmed =
                      window.confirm(
                        selectedRegistration.status ===
                          "confirmed"
                          ? "Move this attendee to the waitlist? This may automatically promote another waitlisted attendee into the newly available spot."
                          : "Move this cancelled registration to the waitlist?"
                      );

                    if (
                      confirmed
                    ) {
                      void manageRegistration(
                        "waitlist"
                      );
                    }
                  }}
                  className="w-full rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-3.5 font-semibold text-amber-200 transition hover:bg-amber-400/10 disabled:opacity-50"
                >
                  {managementAction ===
                  "waitlist"
                    ? "Moving..."
                    : "Move to waitlist"}
                </button>
              )}

              {/* CANCEL */}

              {selectedRegistration.status !==
                "cancelled" && (
                <button
                  type="button"
                  disabled={
                    managementAction !==
                    null
                  }
                  onClick={() => {
                    const confirmed =
                      window.confirm(
                        `Cancel registration for ${
                          fullName(
                            selectedRegistration
                          ) ||
                          selectedRegistration.email ||
                          "this attendee"
                        }?`
                      );

                    if (
                      confirmed
                    ) {
                      void manageRegistration(
                        "cancel"
                      );
                    }
                  }}
                  className="w-full rounded-xl border border-red-400/30 bg-red-400/[0.06] px-5 py-3.5 font-semibold text-red-200 transition hover:bg-red-400/10 disabled:opacity-50"
                >
                  {managementAction ===
                  "cancel"
                    ? "Cancelling..."
                    : "Cancel registration"}
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={
                managementAction !==
                null
              }
              onClick={() =>
                setSelectedRegistration(
                  null
                )
              }
              className="mt-4 w-full py-2 text-sm text-[#71869A] transition hover:text-white disabled:opacity-40"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}