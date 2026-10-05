"use client";

import {
  useState,
} from "react";

import {
  type DocumentActionComponent,
} from "sanity";

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

type ApiResponse = {
  success?: boolean;

  error?: string;

  promoted?: {
    _id: string;

    firstName?: string;
    lastName?: string;

    email?: string;
  }[];
};

function getString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value
    : "";
}

function statusLabel(
  status: string
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
      return status ||
        "Unknown";
  }
}

export const manageEventRegistrationAction: DocumentActionComponent =
  (props) => {
    const [
      dialogOpen,
      setDialogOpen,
    ] =
      useState(false);

    const [
      processing,
      setProcessing,
    ] =
      useState<
        AdminAction | null
      >(null);

    const [
      error,
      setError,
    ] =
      useState<
        string | null
      >(null);

    const registration =
      props.draft ??
      props.published;

    if (
      registration?._type !==
      "eventRegistration"
    ) {
      return null;
    }

    const firstName =
      getString(
        registration.firstName
      );

    const lastName =
      getString(
        registration.lastName
      );

    const email =
      getString(
        registration.email
      );

    const status =
      getString(
        registration.status
      ) as RegistrationStatus;

    /*
      API works with the published
      document ID, not drafts.<id>.
    */

    const registrationId =
      props.id.replace(
        /^drafts\./,
        ""
      );

    async function runAction(
      action: AdminAction
    ) {
      if (processing) {
        return;
      }

      setProcessing(
        action
      );

      setError(null);

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
                  registrationId,

                  action,
                }),
            }
          );

        const data =
          (await response.json()) as
            ApiResponse;

        /*
          No valid BBA admin
          session anymore.
        */

        if (
          response.status ===
          401
        ) {
          window.location.href =
            "/admin/login?next=/studio";

          return;
        }

        if (!response.ok) {
          setError(
            data.error ??
              "Could not update registration."
          );

          return;
        }

        setDialogOpen(
          false
        );

        props.onComplete();

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
                    .filter(
                      Boolean
                    )
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
      } catch (
        requestError
      ) {
        console.error(
          "Manage registration error:",
          requestError
        );

        setError(
          "Could not update registration."
        );
      } finally {
        setProcessing(
          null
        );
      }
    }

    return {
      label:
        "Manage registration",

      tone:
        "primary",

      onHandle: () => {
        setError(null);

        setDialogOpen(
          true
        );
      },

      dialog:
        dialogOpen
          ? {
              type:
                "dialog",

              header:
                "Manage registration",

              onClose: () => {
                if (
                  !processing
                ) {
                  setDialogOpen(
                    false
                  );
                }
              },

              content: (
                <div
                  style={{
                    padding:
                      "24px",
                  }}
                >
                  {/* ATTENDEE */}

                  <div
                    style={{
                      marginBottom:
                        "22px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,

                        fontSize:
                          "12px",

                        opacity:
                          0.65,

                        textTransform:
                          "uppercase",

                        letterSpacing:
                          "0.08em",
                      }}
                    >
                      Attendee
                    </p>

                    <h2
                      style={{
                        margin:
                          "8px 0 0",

                        fontSize:
                          "20px",
                      }}
                    >
                      {[
                        firstName,
                        lastName,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(" ") ||
                        "Registration"}
                    </h2>

                    {email && (
                      <p
                        style={{
                          margin:
                            "6px 0 0",

                          opacity:
                            0.7,
                        }}
                      >
                        {email}
                      </p>
                    )}
                  </div>

                  {/* STATUS */}

                  <div
                    style={{
                      padding:
                        "16px",

                      border:
                        "1px solid rgba(255,255,255,0.12)",

                      borderRadius:
                        "8px",

                      marginBottom:
                        "20px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,

                        fontSize:
                          "11px",

                        opacity:
                          0.6,

                        textTransform:
                          "uppercase",

                        letterSpacing:
                          "0.08em",
                      }}
                    >
                      Current status
                    </p>

                    <p
                      style={{
                        margin:
                          "6px 0 0",

                        fontWeight:
                          700,
                      }}
                    >
                      {statusLabel(
                        status
                      )}
                    </p>
                  </div>

                  {/* ERROR */}

                  {error && (
                    <div
                      style={{
                        marginBottom:
                          "18px",

                        padding:
                          "12px",

                        border:
                          "1px solid rgba(248,113,113,0.35)",

                        borderRadius:
                          "8px",

                        color:
                          "#fecaca",

                        background:
                          "rgba(248,113,113,0.08)",

                        fontSize:
                          "13px",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {/* ACTIONS */}

                  <div
                    style={{
                      display:
                        "flex",

                      flexDirection:
                        "column",

                      gap:
                        "10px",
                    }}
                  >
                    {(status ===
                      "waitlist" ||
                      status ===
                        "cancelled") && (
                      <button
                        type="button"

                        disabled={
                          processing !==
                          null
                        }

                        onClick={() =>
                          void runAction(
                            "confirm"
                          )
                        }

                        style={{
                          padding:
                            "13px",

                          border: 0,

                          borderRadius:
                            "6px",

                          background:
                            "#2dd4a7",

                          color:
                            "#071422",

                          fontWeight:
                            700,

                          cursor:
                            "pointer",

                          opacity:
                            processing
                              ? 0.5
                              : 1,
                        }}
                      >
                        {processing ===
                        "confirm"
                          ? "Confirming..."
                          : "Confirm spot"}
                      </button>
                    )}

                    {status ===
                      "confirmed" && (
                      <button
                        type="button"

                        disabled={
                          processing !==
                          null
                        }

                        onClick={() =>
                          void runAction(
                            "check-in"
                          )
                        }

                        style={{
                          padding:
                            "13px",

                          border: 0,

                          borderRadius:
                            "6px",

                          background:
                            "#0057FF",

                          color:
                            "white",

                          fontWeight:
                            700,

                          cursor:
                            "pointer",

                          opacity:
                            processing
                              ? 0.5
                              : 1,
                        }}
                      >
                        {processing ===
                        "check-in"
                          ? "Checking in..."
                          : "Check in"}
                      </button>
                    )}

                    {status ===
                      "checked-in" && (
                      <button
                        type="button"

                        disabled={
                          processing !==
                          null
                        }

                        onClick={() =>
                          void runAction(
                            "undo-check-in"
                          )
                        }

                        style={{
                          padding:
                            "13px",

                          border:
                            "1px solid rgba(255,255,255,0.2)",

                          borderRadius:
                            "6px",

                          background:
                            "transparent",

                          color:
                            "inherit",

                          fontWeight:
                            700,

                          cursor:
                            "pointer",

                          opacity:
                            processing
                              ? 0.5
                              : 1,
                        }}
                      >
                        {processing ===
                        "undo-check-in"
                          ? "Updating..."
                          : "Undo check-in"}
                      </button>
                    )}

                    {(status ===
                      "confirmed" ||
                      status ===
                        "cancelled") && (
                      <button
                        type="button"

                        disabled={
                          processing !==
                          null
                        }

                        onClick={() => {
                          const confirmed =
                            window.confirm(
                              status ===
                                "confirmed"
                                ? "Move this attendee to the waitlist? This may automatically promote somebody else."
                                : "Move this cancelled attendee to the waitlist?"
                            );

                          if (
                            confirmed
                          ) {
                            void runAction(
                              "waitlist"
                            );
                          }
                        }}

                        style={{
                          padding:
                            "13px",

                          border:
                            "1px solid rgba(255,255,255,0.2)",

                          borderRadius:
                            "6px",

                          background:
                            "transparent",

                          color:
                            "inherit",

                          fontWeight:
                            700,

                          cursor:
                            "pointer",

                          opacity:
                            processing
                              ? 0.5
                              : 1,
                        }}
                      >
                        {processing ===
                        "waitlist"
                          ? "Moving..."
                          : "Move to waitlist"}
                      </button>
                    )}

                    {status !==
                      "cancelled" && (
                      <button
                        type="button"

                        disabled={
                          processing !==
                          null
                        }

                        onClick={() => {
                          const confirmed =
                            window.confirm(
                              `Cancel registration for ${
                                [
                                  firstName,
                                  lastName,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " "
                                  ) ||
                                email ||
                                "this attendee"
                              }?`
                            );

                          if (
                            confirmed
                          ) {
                            void runAction(
                              "cancel"
                            );
                          }
                        }}

                        style={{
                          padding:
                            "13px",

                          border:
                            "1px solid #d95c5c",

                          borderRadius:
                            "6px",

                          background:
                            "transparent",

                          color:
                            "#ff9b9b",

                          fontWeight:
                            700,

                          cursor:
                            "pointer",

                          opacity:
                            processing
                              ? 0.5
                              : 1,
                        }}
                      >
                        {processing ===
                        "cancel"
                          ? "Cancelling..."
                          : "Cancel registration"}
                      </button>
                    )}

                    <button
                      type="button"

                      disabled={
                        processing !==
                        null
                      }

                      onClick={() =>
                        setDialogOpen(
                          false
                        )
                      }

                      style={{
                        padding:
                          "12px",

                        border: 0,

                        background:
                          "transparent",

                        color:
                          "inherit",

                        opacity:
                          0.6,

                        cursor:
                          "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ),
            }
          : false,
    };
  };