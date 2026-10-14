import {
  NextResponse,
} from "next/server";

import {
  randomUUID,
} from "node:crypto";

import {
  client,
} from "@/sanity/lib/client";

import {
  isAdminAuthenticated,
} from "@/lib/admin/auth";

export const runtime =
  "nodejs";

type GalleryImageInput = {
  assetId?: unknown;
  alt?: unknown;
};

type EventBody = {
  title?: unknown;
  slug?: unknown;

  label?: unknown;
  status?: unknown;

  date?: unknown;
  time?: unknown;

  location?: unknown;
  venue?: unknown;
  address?: unknown;

  description?: unknown;
  fullDescription?: unknown;

  coverImageAssetId?: unknown;
  coverImageAlt?: unknown;

  gallery?: unknown;

  capacity?: unknown;
  price?: unknown;
  currency?: unknown;

  onlinePaymentsEnabled?: unknown;

  highlights?: unknown;

  registrationStatus?: unknown;
  registrationUrl?: unknown;
  registrationDeadline?: unknown;
  registrationNote?: unknown;
};

function getString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function getOptionalNumber(
  value: unknown
) {
  if (
    value === "" ||
    value === null ||
    typeof value ===
      "undefined"
  ) {
    return undefined;
  }

  const number =
    typeof value ===
      "number"
      ? value
      : Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : undefined;
}

function slugify(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(
      0,
      96
    );
}

function createPortableText(
  value: string
) {
  if (!value) {
    return undefined;
  }

  const paragraphs =
    value
      .split(/\n\s*\n/)
      .map(
        (paragraph) =>
          paragraph.trim()
      )
      .filter(Boolean);

  if (
    paragraphs.length === 0
  ) {
    return undefined;
  }

  return paragraphs.map(
    (paragraph) => ({
      _type:
        "block",

      _key:
        randomUUID()
          .replaceAll(
            "-",
            ""
          )
          .slice(
            0,
            12
          ),

      style:
        "normal",

      markDefs: [],

      children: [
        {
          _type:
            "span",

          _key:
            randomUUID()
              .replaceAll(
                "-",
                ""
              )
              .slice(
                0,
                12
              ),

          text:
            paragraph,

          marks: [],
        },
      ],
    })
  );
}

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
      WRITE TOKEN
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
      REQUEST
    */

    let body:
      EventBody;

    try {
      body =
        (await request.json()) as
          EventBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      BASIC FIELDS
    */

    const title =
      getString(
        body.title
      );

    const requestedSlug =
      getString(
        body.slug
      );

    const slug =
      slugify(
        requestedSlug ||
          title
      );

    const label =
      getString(
        body.label
      );

    const status =
      getString(
        body.status
      ) ||
      "upcoming";

    const date =
      getString(
        body.date
      );

    const time =
      getString(
        body.time
      );

    const location =
      getString(
        body.location
      );

    const venue =
      getString(
        body.venue
      );

    const address =
      getString(
        body.address
      );

    const description =
      getString(
        body.description
      );

    const fullDescription =
      getString(
        body.fullDescription
      );

    /*
      COVER IMAGE
    */

    const coverImageAssetId =
      getString(
        body.coverImageAssetId
      );

    const coverImageAlt =
      getString(
        body.coverImageAlt
      );

    /*
      GALLERY
    */

    const galleryInput =
      Array.isArray(
        body.gallery
      )
        ? (
            body.gallery as
              GalleryImageInput[]
          )
        : [];

    if (
      galleryInput.length >
      20
    ) {
      return NextResponse.json(
        {
          error:
            "A maximum of 20 gallery images is allowed.",
        },
        {
          status: 400,
        }
      );
    }

    const gallery =
      galleryInput
        .map(
          (image) => {
            const assetId =
              getString(
                image.assetId
              );

            const alt =
              getString(
                image.alt
              );

            if (!assetId) {
              return null;
            }

            return {
              _type:
                "image",

              _key:
                randomUUID()
                  .replaceAll(
                    "-",
                    ""
                  )
                  .slice(
                    0,
                    12
                  ),

              asset: {
                _type:
                  "reference",

                _ref:
                  assetId,
              },

              ...(alt
                ? {
                    alt,
                  }
                : {}),
            };
          }
        )
        .filter(
          (
            image
          ): image is
            NonNullable<
              typeof image
            > =>
            image !== null
        );

    /*
      CAPACITY / PRICE
    */

    const capacity =
      getOptionalNumber(
        body.capacity
      );

    const price =
      getOptionalNumber(
        body.price
      ) ?? 0;

    const currencyRaw =
      getString(
        body.currency
      );

    const currency =
      currencyRaw ===
      "EUR"
        ? "EUR"
        : "CZK";

    const onlinePaymentsEnabled =
      body.onlinePaymentsEnabled ===
      true;

    /*
      REGISTRATION
    */

    const registrationStatus =
      getString(
        body.registrationStatus
      ) ||
      "coming-soon";

    const registrationUrl =
      getString(
        body.registrationUrl
      );

    const registrationDeadline =
      getString(
        body.registrationDeadline
      );

    const registrationNote =
      getString(
        body.registrationNote
      );

    /*
      HIGHLIGHTS
    */

    const highlights =
      Array.isArray(
        body.highlights
      )
        ? body.highlights
            .filter(
              (
                item
              ): item is string =>
                typeof item ===
                "string"
            )
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean)
        : [];

    /*
      VALIDATION
    */

    if (
      !title ||
      !slug ||
      !label ||
      !date ||
      !time ||
      !location ||
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

    if (
      ![
        "upcoming",
        "past",
      ].includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid event status.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ![
        "coming-soon",
        "open",
        "closed",
        "full",
      ].includes(
        registrationStatus
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid registration status.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        date
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid event date.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        time
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Time must use HH:MM format.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof capacity !==
        "undefined" &&
      (
        !Number.isInteger(
          capacity
        ) ||
        capacity < 1
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Capacity must be a positive whole number.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Price cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      onlinePaymentsEnabled &&
      price <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Online payments can only be enabled for a paid event.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      CHECK SLUG
    */

    const existingEvent =
      await client.fetch<{
        _id: string;
      } | null>(
        `
          *[
            _type == "event"
            && slug.current == $slug
          ][0] {
            _id
          }
        `,
        {
          slug,
        }
      );

    if (
      existingEvent
    ) {
      return NextResponse.json(
        {
          error:
            "An event with this slug already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /*
      CREATE
    */

    const writeClient =
      client.withConfig({
        token:
          writeToken,

        useCdn:
          false,
      });

    const portableDescription =
      createPortableText(
        fullDescription
      );

    const created =
      await writeClient.create({
        _type:
          "event",

        title,

        slug: {
          _type:
            "slug",

          current:
            slug,
        },

        label,
        status,

        date,
        time,

        location,

        ...(venue
          ? {
              venue,
            }
          : {}),

        ...(address
          ? {
              address,
            }
          : {}),

        description,

        ...(portableDescription
          ? {
              fullDescription:
                portableDescription,
            }
          : {}),

        ...(coverImageAssetId
          ? {
              coverImage: {
                _type:
                  "image",

                asset: {
                  _type:
                    "reference",

                  _ref:
                    coverImageAssetId,
                },

                ...(coverImageAlt
                  ? {
                      alt:
                        coverImageAlt,
                    }
                  : {}),
              },
            }
          : {}),

        ...(gallery.length >
        0
          ? {
              gallery,
            }
          : {}),

        ...(typeof capacity ===
        "number"
          ? {
              capacity,
            }
          : {}),

        price,
        currency,

        onlinePaymentsEnabled,

        ...(highlights.length >
        0
          ? {
              highlights,
            }
          : {}),

        registrationStatus,

        ...(registrationUrl
          ? {
              registrationUrl,
            }
          : {}),

        ...(registrationDeadline
          ? {
              registrationDeadline,
            }
          : {}),

        ...(registrationNote
          ? {
              registrationNote,
            }
          : {}),
      });

    return NextResponse.json(
      {
        success: true,

        event: {
          _id:
            created._id,

          title:
            created.title,

          slug:
            created.slug
              ?.current,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Admin event creation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not create event.",
      },
      {
        status: 500,
      }
    );
  }
}
