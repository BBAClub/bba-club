import {
  get,
} from "@vercel/blob";

import {
  NextResponse,
} from "next/server";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

import {
  client,
} from "@/sanity/lib/client";

export const runtime =
  "nodejs";

type SubmissionFile = {
  privateFile?: {
    pathname?: string;
    originalFilename?: string;
    contentType?: string;
  };
};

export async function GET(
  request: Request
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      searchParams,
    } = new URL(
      request.url
    );

    const submissionId =
      searchParams
        .get(
          "submissionId"
        )
        ?.trim();

    if (
      !submissionId ||
      !submissionId.startsWith(
        "private.submission-"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid submission.",
        },
        {
          status: 400,
        }
      );
    }

    const submission =
      await client.fetch<
        SubmissionFile | null
      >(
        `
          *[
            _type == "submission"
            && _id == $submissionId
          ][0] {
            privateFile {
              pathname,
              originalFilename,
              contentType
            }
          }
        `,
        {
          submissionId,
        }
      );

    const privateFile =
      submission?.privateFile;

    if (
      !privateFile?.pathname
    ) {
      return NextResponse.json(
        {
          error:
            "This submission has no private attachment.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !privateFile.pathname.startsWith(
        "pending-submissions/"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid attachment path.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await get(
        privateFile.pathname,
        {
          access:
            "private",

          useCache:
            false,
        }
      );

    if (!result) {
      return NextResponse.json(
        {
          error:
            "Attachment not found.",
        },
        {
          status: 404,
        }
      );
    }

    const filename =
      privateFile
        .originalFilename ||
      "attachment";

    return new Response(
      result.stream,
      {
        headers: {
          "Content-Type":
            result.blob
              .contentType ||
            privateFile
              .contentType ||
            "application/octet-stream",

          "Content-Disposition":
            `inline; filename*=UTF-8''${encodeURIComponent(
              filename
            )}`,

          "Cache-Control":
            "private, no-store",

          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(
      "Private submission file error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not open the attachment.",
      },
      {
        status: 500,
      }
    );
  }
}