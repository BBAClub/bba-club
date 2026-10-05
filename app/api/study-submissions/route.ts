import {
  del,
  put,
} from "@vercel/blob";

import {
  NextResponse,
} from "next/server";

import {
  randomUUID,
} from "node:crypto";

import {
  client,
} from "@/sanity/lib/client";

export const runtime =
  "nodejs";

/*
  Vercel Functions have a request
  body limit around 4.5 MB.

  We stay slightly below it.
*/
const MAX_FILE_SIZE =
  4 * 1024 * 1024;

const allowedFileTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const allowedSubmissionTypes = [
  "tip",
  "material",
  "test",
  "link",
];

const allowedTipTypes = [
  "general",
  "lectures",
  "assignments",
  "exam",
  "strategy",
  "resources",
];

function extensionForContentType(
  contentType: string
) {
  switch (contentType) {
    case "application/pdf":
      return ".pdf";

    case "image/png":
      return ".png";

    case "image/jpeg":
      return ".jpg";

    case "image/webp":
      return ".webp";

    default:
      return "";
  }
}

export async function POST(
  request: Request
) {
  let uploadedBlobUrl:
    | string
    | undefined;

  let submissionCreated =
    false;

  try {
    const token =
      process.env
        .SANITY_API_WRITE_TOKEN;

    if (!token) {
      console.error(
        "Missing SANITY_API_WRITE_TOKEN"
      );

      return NextResponse.json(
        {
          error:
            "Server configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      FORM DATA
    */

    const formData =
      await request.formData();

    /*
      HONEYPOT
    */

    const website =
      String(
        formData.get(
          "website"
        ) ?? ""
      ).trim();

    if (website) {
      return NextResponse.json({
        success: true,
      });
    }

    /*
      INPUT
    */

    const name =
      String(
        formData.get(
          "name"
        ) ?? ""
      ).trim();

    const email =
      String(
        formData.get(
          "email"
        ) ?? ""
      )
        .trim()
        .toLowerCase();

    const submissionType =
      String(
        formData.get(
          "submissionType"
        ) ?? ""
      ).trim();

    const course =
      String(
        formData.get(
          "course"
        ) ?? ""
      ).trim();

    const tipType =
      String(
        formData.get(
          "tipType"
        ) ?? ""
      ).trim();

    const title =
      String(
        formData.get(
          "title"
        ) ?? ""
      ).trim();

    const description =
      String(
        formData.get(
          "description"
        ) ?? ""
      ).trim();

    const url =
      String(
        formData.get(
          "url"
        ) ?? ""
      ).trim();

    const fileValue =
      formData.get(
        "file"
      );

    const hasFile =
      fileValue instanceof File &&
      fileValue.size > 0;

    /*
      REQUIRED FIELDS
    */

    if (
      !name ||
      !email ||
      !submissionType ||
      !title ||
      !description
    ) {
      return NextResponse.json(
        {
          error:
            "Please fill in all required fields.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      LENGTH LIMITS
    */

    if (
      name.length > 120 ||
      email.length > 254 ||
      title.length > 200 ||
      description.length >
        5000 ||
      course.length > 150 ||
      url.length > 2000
    ) {
      return NextResponse.json(
        {
          error:
            "One or more fields are too long.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      SUBMISSION TYPE
    */

    if (
      !allowedSubmissionTypes.includes(
        submissionType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid submission type.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      COURSE
    */

    if (
      [
        "tip",
        "material",
        "test",
      ].includes(
        submissionType
      ) &&
      !course
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a course.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      TIP CATEGORY
    */

    if (
      submissionType ===
      "tip" &&
      !allowedTipTypes.includes(
        tipType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a tip category.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      EMAIL
    */

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        email
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      URL
    */

    if (url) {
      try {
        const parsedUrl =
          new URL(url);

        if (
          parsedUrl.protocol !==
            "http:" &&
          parsedUrl.protocol !==
            "https:"
        ) {
          throw new Error(
            "Invalid protocol"
          );
        }
      } catch {
        return NextResponse.json(
          {
            error:
              "Please enter a valid URL.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      submissionType ===
        "link" &&
      !url
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter the URL you want to share.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      MATERIAL

      It needs either an external
      URL or an uploaded file.
    */

    if (
      submissionType ===
        "material" &&
      !url &&
      !hasFile
    ) {
      return NextResponse.json(
        {
          error:
            "Please upload a file or add an external URL.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      FILE VALIDATION
    */

    if (hasFile) {
      if (
        fileValue.size >
        MAX_FILE_SIZE
      ) {
        return NextResponse.json(
          {
            error:
              "The file is too large. Maximum size is 4 MB.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !allowedFileTypes.includes(
          fileValue.type
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Unsupported file type.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
      PRIVATE BLOB UPLOAD

      Nothing is uploaded to
      Sanity Assets at this stage.
    */

    let privateFile:
      | {
          url: string;
          pathname: string;
          originalFilename: string;
          contentType: string;
          size: number;
        }
      | undefined;

    if (hasFile) {
      const extension =
        extensionForContentType(
          fileValue.type
        );

      const pathname =
        `pending-submissions/${randomUUID()}${extension}`;

      const blob =
        await put(
          pathname,
          fileValue,
          {
            access:
              "private",

            addRandomSuffix:
              false,

            contentType:
              fileValue.type,
          }
        );

      uploadedBlobUrl =
        blob.url;

      privateFile = {
        url:
          blob.url,

        pathname:
          blob.pathname,

        originalFilename:
          fileValue.name
            .trim()
            .slice(
              0,
              255
            ),

        contentType:
          fileValue.type,

        size:
          fileValue.size,
      };
    }

    /*
      SANITY WRITE CLIENT
    */

    const writeClient =
      client.withConfig({
        token,
        useCdn: false,
      });

    /*
      PRIVATE SUBMISSION ID
    */

    const submissionId =
      `private.submission-${randomUUID()}`;

    /*
      CREATE PRIVATE SUBMISSION
    */

    await writeClient.create({
      _id:
        submissionId,

      _type:
        "submission",

      status:
        "pending",

      submittedAt:
        new Date()
          .toISOString(),

      name,

      email,

      submissionType,

      course:
        course ||
        undefined,

      tipType:
        submissionType ===
        "tip"
          ? tipType
          : undefined,

      title,

      description,

      url:
        url ||
        undefined,

      privateFile,
    });

    submissionCreated =
      true;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    /*
      If Blob upload succeeded but
      Sanity creation failed, clean
      up the orphaned private blob.
    */

    if (
      uploadedBlobUrl &&
      !submissionCreated
    ) {
      try {
        await del(
          uploadedBlobUrl
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "Could not clean up orphaned Blob:",
          cleanupError
        );
      }
    }

    console.error(
      "Study submission error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while sending your submission.",
      },
      {
        status: 500,
      }
    );
  }
}