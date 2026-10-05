"use client";

import {
  useState,
} from "react";

import {
  type DocumentActionComponent,
} from "sanity";

type ReviewAction =
  | "approve"
  | "reject"
  | "unpublish";

type ReviewResponse = {
  success?: boolean;
  error?: string;
  status?: string;
  resourceId?: string;
};

function formatBytes(
  bytes: number
) {
  if (
    !Number.isFinite(
      bytes
    ) ||
    bytes <= 0
  ) {
    return "";
  }

  if (
    bytes < 1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(
      1
    )} KB`;
  }

  return `${(
    bytes /
    (
      1024 *
      1024
    )
  ).toFixed(
    1
  )} MB`;
}

export const reviewSubmissionAction:
  DocumentActionComponent =
  (props) => {
    const [
      dialogOpen,
      setDialogOpen,
    ] = useState(
      false
    );

    const [
      processing,
      setProcessing,
    ] =
      useState<
        ReviewAction | null
      >(
        null
      );

    const [
      previewing,
      setPreviewing,
    ] = useState(
      false
    );

    const submission =
      props.draft ??
      props.published;

    const moderationState =
      props.published ??
      props.draft;

    const isSubmission =
      submission?._type ===
      "submission";

    const status =
      typeof moderationState
        ?.status ===
      "string"
        ? moderationState.status
        : "";

    const isPending =
      status ===
      "pending";

    const isApproved =
      status ===
      "approved";

    /*
      Rejected submission nemá
      tuto action.

      Pending -> review.
      Approved -> manage publish.
    */

    if (
      !isSubmission ||
      (
        !isPending &&
        !isApproved
      )
    ) {
      return null;
    }

    const submissionId =
      props.id.replace(
        /^drafts\./,
        ""
      );

    const title =
      typeof submission
        ?.title ===
      "string"
        ? submission.title
        : "Untitled";

    const course =
      typeof submission
        ?.course ===
      "string"
        ? submission.course
        : "";

    const tipType =
      typeof submission
        ?.tipType ===
      "string"
        ? submission.tipType
        : "";

    const studentName =
      typeof submission
        ?.name ===
      "string"
        ? submission.name
        : "";

    const submissionType =
      typeof submission
        ?.submissionType ===
      "string"
        ? submission
            .submissionType
        : "";

    const publishedResourceId =
      typeof moderationState
        ?.publishedResourceId ===
      "string"
        ? moderationState
            .publishedResourceId
        : "";

    const publishedAt =
      typeof moderationState
        ?.publishedAt ===
      "string"
        ? moderationState
            .publishedAt
        : "";

    /*
      publishedAt se při
      Unpublish unsetne.

      Tak poznáme, zda je resource
      právě live.
    */

    const isCurrentlyPublished =
      isApproved &&
      Boolean(
        publishedResourceId
      ) &&
      Boolean(
        publishedAt
      );

    const privateFile =
      submission
        ?.privateFile &&
      typeof submission
        .privateFile ===
        "object"
        ? (
            submission.privateFile as {
              originalFilename?:
                unknown;

              size?:
                unknown;

              contentType?:
                unknown;
            }
          )
        : undefined;

    const filename =
      typeof privateFile
        ?.originalFilename ===
      "string"
        ? privateFile
            .originalFilename
        : "";

    const fileSize =
      typeof privateFile
        ?.size ===
      "number"
        ? privateFile.size
        : 0;

    const contentType =
      typeof privateFile
        ?.contentType ===
      "string"
        ? privateFile
            .contentType
        : "";

    async function runReview(
      action:
        ReviewAction
    ) {
      if (
        processing
      ) {
        return;
      }

      if (
        action ===
        "unpublish"
      ) {
        const confirmed =
          window.confirm(
            "Hide this resource from the public Study Hub? The submission and uploaded file will be kept so it can be published again later."
          );

        if (
          !confirmed
        ) {
          return;
        }
      }

      setProcessing(
        action
      );

      try {
        const response =
          await fetch(
            "/api/study-submissions/review",
            {
              method:
                "POST",

              credentials:
                "same-origin",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    submissionId,
                    action,
                  }
                ),
            }
          );

        const text =
          await response.text();

        let data:
          ReviewResponse =
          {};

        try {
          data =
            text
              ? JSON.parse(
                  text
                )
              : {};
        } catch {
          data = {};
        }

        if (
          response.status ===
          401
        ) {
          throw new Error(
            "Your BBA admin session is missing or expired. Open /admin in this browser, sign in, then try again."
          );
        }

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ??
              "Could not update submission."
          );
        }

        setDialogOpen(
          false
        );

        props.onComplete();

        if (
          action ===
          "unpublish"
        ) {
          window.alert(
            "Resource unpublished. It is now hidden from the Study Hub and can be published again later."
          );
        } else if (
          action ===
            "approve" &&
          isApproved
        ) {
          window.alert(
            "Resource published again."
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Review submission error:",
          error
        );

        window.alert(
          error instanceof
            Error
            ? error.message
            : "Could not update submission."
        );
      } finally {
        setProcessing(
          null
        );
      }
    }

    async function openAttachment() {
      if (
        !filename ||
        previewing
      ) {
        return;
      }

      /*
        Open tab immediately
        so Safari doesn't block
        the async popup.
      */

      const previewWindow =
        window.open(
          "about:blank",
          "_blank"
        );

      setPreviewing(
        true
      );

      try {
        const response =
          await fetch(
            `/api/study-submissions/file?submissionId=${encodeURIComponent(
              submissionId
            )}`,
            {
              credentials:
                "same-origin",
            }
          );

        if (
          response.status ===
          401
        ) {
          throw new Error(
            "Your BBA admin session is missing or expired. Open /admin in this browser and sign in first."
          );
        }

        if (
          !response.ok
        ) {
          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          throw new Error(
            data.error ??
              "Could not open attachment."
          );
        }

        const blob =
          await response.blob();

        const objectUrl =
          URL.createObjectURL(
            blob
          );

        if (
          previewWindow
        ) {
          previewWindow
            .location
            .href =
            objectUrl;
        } else {
          window.open(
            objectUrl,
            "_blank"
          );
        }

        setTimeout(
          () => {
            URL.revokeObjectURL(
              objectUrl
            );
          },
          60_000
        );
      } catch (
        error
      ) {
        if (
          previewWindow
        ) {
          previewWindow.close();
        }

        console.error(
          "Preview attachment error:",
          error
        );

        window.alert(
          error instanceof
            Error
            ? error.message
            : "Could not open attachment."
        );
      } finally {
        setPreviewing(
          false
        );
      }
    }

    const actionLabel =
      isPending
        ? "Review submission"
        : isCurrentlyPublished
          ? "Manage publication"
          : "Republish resource";

    return {
      label:
        actionLabel,

      tone:
        "primary",

      onHandle: () => {
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
                isPending
                  ? "Review submission"
                  : "Manage publication",

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
                  {/* HEADER */}

                  <div
                    style={{
                      marginBottom:
                        "24px",
                    }}
                  >
                    <p
                      style={{
                        margin:
                          0,

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
                      {isPending
                        ? "Submission"
                        : "Approved submission"}
                    </p>

                    <h2
                      style={{
                        margin:
                          "8px 0 0",

                        fontSize:
                          "20px",
                      }}
                    >
                      {
                        title
                      }
                    </h2>

                    {submissionType && (
                      <p
                        style={{
                          margin:
                            "8px 0 0",

                          opacity:
                            0.7,
                        }}
                      >
                        Type:{" "}
                        {
                          submissionType
                        }
                      </p>
                    )}

                    {course && (
                      <p
                        style={{
                          margin:
                            "4px 0 0",

                          opacity:
                            0.7,
                        }}
                      >
                        Course:{" "}
                        {
                          course
                        }
                      </p>
                    )}

                    {tipType && (
                      <p
                        style={{
                          margin:
                            "4px 0 0",

                          opacity:
                            0.7,
                        }}
                      >
                        Category:{" "}
                        {
                          tipType
                        }
                      </p>
                    )}

                    {studentName && (
                      <p
                        style={{
                          margin:
                            "4px 0 0",

                          opacity:
                            0.7,
                        }}
                      >
                        Shared by:{" "}
                        {
                          studentName
                        }
                      </p>
                    )}
                  </div>

                  {/* PRIVATE ATTACHMENT */}

                  {isPending &&
                    filename && (
                      <div
                        style={{
                          padding:
                            "16px",

                          marginBottom:
                            "20px",

                          border:
                            "1px solid rgba(255,255,255,0.12)",

                          borderRadius:
                            "8px",
                        }}
                      >
                        <p
                          style={{
                            margin:
                              0,

                            fontWeight:
                              700,
                          }}
                        >
                          Private
                          attachment
                        </p>

                        <p
                          style={{
                            margin:
                              "6px 0 0",

                            opacity:
                              0.7,

                            fontSize:
                              "13px",
                          }}
                        >
                          {
                            filename
                          }
                        </p>

                        {(fileSize >
                          0 ||
                          contentType) && (
                          <p
                            style={{
                              margin:
                                "4px 0 0",

                              opacity:
                                0.6,

                              fontSize:
                                "12px",
                            }}
                          >
                            {[
                              contentType,

                              fileSize >
                              0
                                ? formatBytes(
                                    fileSize
                                  )
                                : "",
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " · "
                              )}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={
                            openAttachment
                          }
                          disabled={
                            previewing
                          }
                          style={{
                            width:
                              "100%",

                            marginTop:
                              "14px",

                            padding:
                              "11px 14px",

                            border:
                              "1px solid rgba(255,255,255,0.18)",

                            borderRadius:
                              "6px",

                            background:
                              "transparent",

                            color:
                              "inherit",

                            cursor:
                              previewing
                                ? "not-allowed"
                                : "pointer",

                            fontWeight:
                              600,

                            opacity:
                              previewing
                                ? 0.6
                                : 1,
                          }}
                        >
                          {previewing
                            ? "Opening..."
                            : "Open attachment"}
                        </button>
                      </div>
                    )}

                  {isPending ? (
                    <>
                      {/* PENDING INFO */}

                      <div
                        style={{
                          padding:
                            "16px",

                          border:
                            "1px solid rgba(255,255,255,0.12)",

                          borderRadius:
                            "8px",

                          marginBottom:
                            "24px",
                        }}
                      >
                        <p
                          style={{
                            margin:
                              0,

                            lineHeight:
                              1.6,

                            opacity:
                              0.8,
                          }}
                        >
                          Approving
                          publishes the
                          resource to the
                          Study Hub. A
                          private
                          attachment is
                          copied to a
                          public Sanity
                          asset only
                          after approval.
                        </p>
                      </div>

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
                        {/* APPROVE */}

                        <button
                          type="button"
                          onClick={() =>
                            runReview(
                              "approve"
                            )
                          }
                          disabled={
                            processing !==
                              null ||
                            previewing
                          }
                          style={{
                            width:
                              "100%",

                            padding:
                              "13px 16px",

                            border:
                              "none",

                            borderRadius:
                              "6px",

                            cursor:
                              processing
                                ? "not-allowed"
                                : "pointer",

                            background:
                              "#2dd4a7",

                            color:
                              "#071422",

                            fontWeight:
                              700,

                            fontSize:
                              "14px",

                            opacity:
                              processing
                                ? 0.6
                                : 1,
                          }}
                        >
                          {processing ===
                          "approve"
                            ? "Publishing..."
                            : "Approve & publish to Study Hub"}
                        </button>

                        {/* REJECT */}

                        <button
                          type="button"
                          onClick={() =>
                            runReview(
                              "reject"
                            )
                          }
                          disabled={
                            processing !==
                              null ||
                            previewing
                          }
                          style={{
                            width:
                              "100%",

                            padding:
                              "13px 16px",

                            border:
                              "1px solid #d95c5c",

                            borderRadius:
                              "6px",

                            cursor:
                              processing
                                ? "not-allowed"
                                : "pointer",

                            background:
                              "transparent",

                            color:
                              "#ff9b9b",

                            fontWeight:
                              700,

                            fontSize:
                              "14px",

                            opacity:
                              processing
                                ? 0.6
                                : 1,
                          }}
                        >
                          {processing ===
                          "reject"
                            ? "Rejecting..."
                            : "Reject submission"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDialogOpen(
                              false
                            )
                          }
                          disabled={
                            processing !==
                            null
                          }
                          style={{
                            width:
                              "100%",

                            padding:
                              "12px 16px",

                            border:
                              "none",

                            borderRadius:
                              "6px",

                            cursor:
                              processing
                                ? "not-allowed"
                                : "pointer",

                            background:
                              "transparent",

                            color:
                              "inherit",

                            opacity:
                              0.65,

                            fontSize:
                              "14px",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* APPROVED / UNPUBLISHED */}

                      <div
                        style={{
                          padding:
                            "16px",

                          border:
                            "1px solid rgba(255,255,255,0.12)",

                          borderRadius:
                            "8px",

                          marginBottom:
                            "24px",
                        }}
                      >
                        <p
                          style={{
                            margin:
                              0,

                            lineHeight:
                              1.6,

                            opacity:
                              0.8,
                          }}
                        >
                          {isCurrentlyPublished
                            ? "This resource is currently visible in the public Study Hub. Unpublishing hides it without deleting the submission or its Sanity file asset."
                            : "This resource is currently hidden from the public Study Hub. You can publish it again without asking the student to upload the file again."}
                        </p>
                      </div>

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
                        {isCurrentlyPublished ? (
                          <button
                            type="button"
                            onClick={() =>
                              runReview(
                                "unpublish"
                              )
                            }
                            disabled={
                              processing !==
                              null
                            }
                            style={{
                              width:
                                "100%",

                              padding:
                                "13px 16px",

                              border:
                                "1px solid #d7a64a",

                              borderRadius:
                                "6px",

                              cursor:
                                processing
                                  ? "not-allowed"
                                  : "pointer",

                              background:
                                "transparent",

                              color:
                                "#f1c46d",

                              fontWeight:
                                700,

                              fontSize:
                                "14px",

                              opacity:
                                processing
                                  ? 0.6
                                  : 1,
                            }}
                          >
                            {processing ===
                            "unpublish"
                              ? "Unpublishing..."
                              : "Unpublish from Study Hub"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              runReview(
                                "approve"
                              )
                            }
                            disabled={
                              processing !==
                              null
                            }
                            style={{
                              width:
                                "100%",

                              padding:
                                "13px 16px",

                              border:
                                "none",

                              borderRadius:
                                "6px",

                              cursor:
                                processing
                                  ? "not-allowed"
                                  : "pointer",

                              background:
                                "#2dd4a7",

                              color:
                                "#071422",

                              fontWeight:
                                700,

                              fontSize:
                                "14px",

                              opacity:
                                processing
                                  ? 0.6
                                  : 1,
                            }}
                          >
                            {processing ===
                            "approve"
                              ? "Publishing..."
                              : "Publish again"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setDialogOpen(
                              false
                            )
                          }
                          disabled={
                            processing !==
                            null
                          }
                          style={{
                            width:
                              "100%",

                            padding:
                              "12px 16px",

                            border:
                              "none",

                            borderRadius:
                              "6px",

                            cursor:
                              processing
                                ? "not-allowed"
                                : "pointer",

                            background:
                              "transparent",

                            color:
                              "inherit",

                            opacity:
                              0.65,

                            fontSize:
                              "14px",
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ),
            }
          : false,
    };
  };