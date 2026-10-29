import {
  NextResponse,
} from "next/server";

import {
  client,
} from "@/sanity/lib/client";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const runtime =
  "nodejs";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

export async function POST(
  request: Request
) {
  try {
    /*
      AUTH
    */

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

    /*
      SANITY WRITE TOKEN
    */

    const writeToken =
      process.env
        .SANITY_API_WRITE_TOKEN;

    if (!writeToken) {
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

    let formData:
      FormData;

    try {
      formData =
        await request.formData();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid upload request.",
        },
        {
          status: 400,
        }
      );
    }

    const file =
      formData.get(
        "file"
      );

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "No image was provided.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      VALIDATION
    */

    if (
      !ALLOWED_TYPES.has(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only JPG, PNG and WebP images are supported.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.size <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "The uploaded file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "The image is too large. Maximum size is 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      UPLOAD TO SANITY
    */

    const writeClient =
      client.withConfig({
        token:
          writeToken,

        useCdn:
          false,
      });

    const buffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    const asset =
      await writeClient
        .assets
        .upload(
          "image",
          buffer,
          {
            filename:
              file.name ||
              "place-image",
          }
        );

    return NextResponse.json(
      {
        success: true,

        asset: {
          _id:
            asset._id,

          url:
            asset.url,

          originalFilename:
            asset.originalFilename,

          metadata:
            asset.metadata
              ? {
                  dimensions:
                    asset
                      .metadata
                      .dimensions
                      ? {
                          width:
                            asset
                              .metadata
                              .dimensions
                              .width,

                          height:
                            asset
                              .metadata
                              .dimensions
                              .height,

                          aspectRatio:
                            asset
                              .metadata
                              .dimensions
                              .aspectRatio,
                        }
                      : undefined,
                }
              : undefined,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Admin place image upload error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not upload image.",
      },
      {
        status: 500,
      }
    );
  }
}
