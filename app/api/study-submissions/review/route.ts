import {
  del,
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

type ReviewAction =
  | "approve"
  | "reject"
  | "unpublish";

type PrivateFile = {
  url?: string;
  pathname?: string;
  originalFilename?: string;
  contentType?: string;
  size?: number;
};

type Submission = {
  _id: string;

  status?: string;

  name?: string;
  email?: string;

  submissionType?: string;

  course?: string;
  tipType?: string;

  title?: string;
  description?: string;

  url?: string;

  privateFile?: PrivateFile;

  publishedResourceId?: string;
  publishedAt?: string;
};

function slugify(
  value: string
) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function getTipTag(
  tipType: string
) {
  switch (tipType) {
    case "lectures":
      return "LECTURES & SEMINARS";

    case "assignments":
      return "ASSIGNMENTS & PROJECTS";

    case "exam":
      return "EXAM / TEST";

    case "strategy":
      return "STUDY STRATEGY";

    case "resources":
      return "RESOURCES & MATERIALS";

    case "general":
    default:
      return "GENERAL TIP";
  }
}

function getResourceType(
  submissionType: string
) {
  const map: Record<
    string,
    | "Tip"
    | "Material"
    | "Test"
    | "Link"
  > = {
    tip: "Tip",

    material:
      "Material",

    test:
      "Test",

    link:
      "Link",
  };

  return map[
    submissionType
  ];
}

function getTag(
  resourceType:
    | "Tip"
    | "Material"
    | "Test"
    | "Link",

  tipType: string
) {
  if (
    resourceType ===
    "Tip"
  ) {
    return getTipTag(
      tipType
    );
  }

  if (
    resourceType ===
    "Material"
  ) {
    return "MATERIAL";
  }

  if (
    resourceType ===
    "Test"
  ) {
    return "TEST PREVIEW";
  }

  return "USEFUL LINK";
}

function getSymbol(
  resourceType:
    | "Tip"
    | "Material"
    | "Test"
    | "Link"
) {
  if (
    resourceType ===
    "Tip"
  ) {
    return "💡";
  }

  if (
    resourceType ===
    "Material"
  ) {
    return "📄";
  }

  if (
    resourceType ===
    "Test"
  ) {
    return "📝";
  }

  return "🔗";
}

function getResourceId(
  submissionId: string
) {
  const suffix =
    submissionId.replace(
      /^private\.submission-/,
      ""
    );

  return `study-resource-${suffix}`;
}

function getPublicSlug(
  title: string,

  course: string,

  resourceType:
    | "Tip"
    | "Material"
    | "Test"
    | "Link",

  submissionId: string
) {
  if (
    resourceType ===
    "Link"
  ) {
    return undefined;
  }

  const suffix =
    submissionId
      .replace(
        /^private\.submission-/,
        ""
      )
      .replace(
        /[^a-zA-Z0-9]/g,
        ""
      )
      .slice(
        0,
        8
      );

  const base =
    resourceType ===
      "Tip" &&
    course
      ? `${course}-${title}`
      : title;

  const cleanBase =
    slugify(
      base
    ) ||
    resourceType
      .toLowerCase();

  return `${cleanBase}-${suffix}`;
}

export async function POST(
  request: Request
) {
  try {
    /*
      ADMIN AUTH
    */

    const authenticated =
      await isAdminAuthenticated();

    if (
      !authenticated
    ) {
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

    /*
      SANITY WRITE TOKEN
    */

    const writeToken =
      process.env
        .SANITY_API_WRITE_TOKEN;

    if (
      !writeToken
    ) {
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

    const body =
      await request.json();

    const submissionId =
      String(
        body?.submissionId ??
          ""
      )
        .replace(
          /^drafts\./,
          ""
        )
        .trim();

    const action =
      String(
        body?.action ??
          ""
      ) as ReviewAction;

    if (
      !submissionId.startsWith(
        "private.submission-"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid submission ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      action !==
        "approve" &&
      action !==
        "reject" &&
      action !==
        "unpublish"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid review action.",
        },
        {
          status: 400,
        }
      );
    }

    const writeClient =
      client.withConfig({
        token:
          writeToken,

        useCdn:
          false,
      });

    /*
      LOAD SUBMISSION
    */

    const submission =
      await writeClient.fetch<
        Submission | null
      >(
        `
          *[
            _type == "submission"
            && _id == $submissionId
          ][0] {
            _id,
            status,
            name,
            email,
            submissionType,
            course,
            tipType,
            title,
            description,
            url,

            privateFile {
              url,
              pathname,
              originalFilename,
              contentType,
              size
            },

            publishedResourceId,
            publishedAt
          }
        `,
        {
          submissionId,
        }
      );

    if (
      !submission
    ) {
      return NextResponse.json(
        {
          error:
            "Submission not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      UNPUBLISH

      Resource ani Sanity asset
      nemažeme.

      Jen ho skryjeme z webu.

      Díky tomu jde později
      znovu publikovat bez
      dalšího uploadu.
    */

    if (
      action ===
      "unpublish"
    ) {
      if (
        submission.status !==
        "approved"
      ) {
        return NextResponse.json(
          {
            error:
              "Only approved submissions can be unpublished.",
          },
          {
            status: 409,
          }
        );
      }

      const resourceId =
        submission
          .publishedResourceId;

      if (
        !resourceId
      ) {
        return NextResponse.json(
          {
            error:
              "This submission has no published resource.",
          },
          {
            status: 409,
          }
        );
      }

      const resourceExists =
        await writeClient.fetch<boolean>(
          `
            defined(
              *[
                _type == "studyResource"
                && _id == $resourceId
              ][0]._id
            )
          `,
          {
            resourceId,
          }
        );

      if (
        !resourceExists
      ) {
        return NextResponse.json(
          {
            error:
              "The published Study Resource could not be found.",
          },
          {
            status: 404,
          }
        );
      }

      await writeClient
        .patch(
          resourceId
        )
        .set({
          isPublished:
            false,
        })
        .commit();

      /*
        publishedAt zároveň používáme
        jako informaci, zda je resource
        právě live.
      */

      await writeClient
        .patch(
          submissionId
        )
        .unset([
          "publishedAt",
        ])
        .commit();

      return NextResponse.json({
        success:
          true,

        status:
          "unpublished",

        resourceId,
      });
    }

    /*
      REJECT
    */

    if (
      action ===
      "reject"
    ) {
      if (
        submission.status !==
        "pending"
      ) {
        return NextResponse.json(
          {
            error:
              "Only pending submissions can be rejected.",
          },
          {
            status: 409,
          }
        );
      }

      /*
        Private file zatím
        necháváme uložený.

        Později můžeme přidat
        retention cleanup.
      */

      await writeClient
        .patch(
          submissionId
        )
        .set({
          status:
            "rejected",
        })
        .commit();

      return NextResponse.json({
        success:
          true,

        status:
          "rejected",
      });
    }

    /*
      APPROVE / REPUBLISH
    */

    if (
      submission.status ===
      "rejected"
    ) {
      return NextResponse.json(
        {
          error:
            "Rejected submissions cannot be published directly.",
        },
        {
          status: 409,
        }
      );
    }

    const title =
      String(
        submission.title ??
          ""
      ).trim();

    const description =
      String(
        submission
          .description ??
          ""
      ).trim();

    const course =
      String(
        submission.course ??
          ""
      ).trim();

    const tipType =
      String(
        submission.tipType ??
          ""
      ).trim();

    const submissionType =
      String(
        submission
          .submissionType ??
          ""
      ).trim();

    const resourceType =
      getResourceType(
        submissionType
      );

    if (
      !resourceType
    ) {
      return NextResponse.json(
        {
          error:
            "Unsupported submission type.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !title ||
      !description
    ) {
      return NextResponse.json(
        {
          error:
            "Submission is missing required content.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      resourceType ===
        "Tip" &&
      (
        !course ||
        !tipType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Tip submission is missing course or category.",
        },
        {
          status: 400,
        }
      );
    }

    const resourceId =
      submission
        .publishedResourceId ||
      getResourceId(
        submissionId
      );

    /*
      ZJISTÍME, JESTLI UŽ
      RESOURCE EXISTUJE
    */

    const existingResourceId =
      await writeClient.fetch<
        string | null
      >(
        `
          *[
            _type == "studyResource"
            && _id == $resourceId
          ][0]._id
        `,
        {
          resourceId,
        }
      );

    /*
      REPUBLISH

      Pokud resource existuje,
      stačí ho znovu zpřístupnit.

      Soubor se znovu
      nenahrává.
    */

    if (
      existingResourceId
    ) {
      await writeClient
        .patch(
          existingResourceId
        )
        .set({
          isPublished:
            true,
        })
        .commit();
    } else {
      /*
        Pokud někdo schválený
        file-based resource
        ručně smazal přímo ze
        Sanity, může už být
        původní private Blob pryč.

        V takovém případě raději
        skončíme chybou, než
        vytvořit resource bez
        přílohy.
      */

      const fileBasedResource =
        resourceType ===
          "Material" ||
        resourceType ===
          "Test";

      if (
        submission.status ===
          "approved" &&
        fileBasedResource &&
        !submission.url &&
        !submission
          .privateFile
          ?.pathname
      ) {
        return NextResponse.json(
          {
            error:
              "The published resource was deleted and its original private file is no longer available. Upload the file again before republishing.",
          },
          {
            status: 409,
          }
        );
      }

      /*
        PRIVATE FILE
        -> PUBLIC SANITY ASSET
      */

      let publicFile:
        | {
            _type:
              "file";

            asset: {
              _type:
                "reference";

              _ref:
                string;
            };
          }
        | undefined;

      const privateFile =
        submission
          .privateFile;

      if (
        privateFile?.pathname
      ) {
        if (
          !privateFile
            .pathname
            .startsWith(
              "pending-submissions/"
            )
        ) {
          return NextResponse.json(
            {
              error:
                "Invalid private attachment path.",
            },
            {
              status: 400,
            }
          );
        }

        const privateBlob =
          await get(
            privateFile
              .pathname,
            {
              access:
                "private",

              useCache:
                false,
            }
          );

        if (
          !privateBlob
        ) {
          return NextResponse.json(
            {
              error:
                "Private attachment could not be found.",
            },
            {
              status: 404,
            }
          );
        }

        const arrayBuffer =
          await new Response(
            privateBlob.stream
          ).arrayBuffer();

        const buffer =
          Buffer.from(
            arrayBuffer
          );

        const filename =
          privateFile
            .originalFilename ||
          "student-resource";

        const contentType =
          privateFile
            .contentType ||
          privateBlob
            .blob
            .contentType ||
          "application/octet-stream";

        const asset =
          await writeClient
            .assets
            .upload(
              "file",

              buffer,

              {
                filename,
                contentType,
              }
            );

        publicFile = {
          _type:
            "file",

          asset: {
            _type:
              "reference",

            _ref:
              asset._id,
          },
        };
      }

      /*
        PUBLIC SLUG

        Student email se
        nepoužívá.
      */

      const slug =
        getPublicSlug(
          title,
          course,
          resourceType,
          submissionId
        );

      const studyResource = {
        _id:
          resourceId,

        _type:
          "studyResource",

        title,

        resourceType,

        description,

        course:
          course ||
          undefined,

        tipType:
          resourceType ===
          "Tip"
            ? tipType
            : undefined,

        tag:
          getTag(
            resourceType,
            tipType
          ),

        symbol:
          getSymbol(
            resourceType
          ),

        author:
          submission.name
            ? String(
                submission
                  .name
              )
            : "Student submission",

        order:
          100,

        /*
          NOVÉ
        */

        isPublished:
          true,

        slug:
          slug
            ? {
                _type:
                  "slug",

                current:
                  slug,
              }
            : undefined,

        externalUrl:
          submission.url
            ? String(
                submission
                  .url
              )
            : undefined,

        file:
          publicFile,
      };

      await writeClient
        .createIfNotExists(
          studyResource
        );
    }

    /*
      MARK SUBMISSION
      AS PUBLISHED
    */

    const publishedAt =
      new Date()
        .toISOString();

    await writeClient
      .patch(
        submissionId
      )
      .set({
        status:
          "approved",

        publishedResourceId:
          resourceId,

        publishedAt,
      })
      .commit();

    /*
      PRIVATE BLOB CLEANUP

      Public Sanity asset ale
      zůstává, takže pozdější
      Unpublish / Republish
      funguje.
    */

    const privateFile =
      submission
        .privateFile;

    if (
      privateFile?.url
    ) {
      try {
        await del(
          privateFile.url
        );

        await writeClient
          .patch(
            submissionId
          )
          .unset([
            "privateFile",
          ])
          .commit();
      } catch (
        cleanupError
      ) {
        console.error(
          "Private Blob cleanup failed:",
          cleanupError
        );
      }
    }

    return NextResponse.json({
      success:
        true,

      status:
        "approved",

      resourceId,
    });
  } catch (
    error
  ) {
    console.error(
      "Review submission error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Could not review submission.",
      },
      {
        status: 500,
      }
    );
  }
}