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
    .slice(0, 96);
}

function createPortableText(
  value: string
) {
  const paragraphs =
    value
      .split(/\n\s*\n/)
      .map(
        (paragraph) =>
          paragraph.trim()
      )
      .filter(Boolean);

  return paragraphs.map(
    (paragraph) => ({
      _type: "block",

      _key:
        randomUUID()
          .replaceAll(
            "-",
            ""
          )
          .slice(0, 12),

      style: "normal",

      markDefs: [],

      children: [
        {
          _type: "span",

          _key:
            randomUUID()
              .replaceAll(
                "-",
                ""
              )
              .slice(0, 12),

          text:
            paragraph,

          marks: [],
        },
      ],
    })
  );
}

export async function PATCH(
  request: Request,
  context: {
    params:
      Promise<{
        slug: string;
      }>;
  }
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
      CURRENT EVENT
    */

    const {
      slug: currentSlug,
    } =
      await context.params;

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
          slug:
            currentSlug,
        }
      );

    if (!existingEvent) {
      return NextResponse.json(
        {
          error:
            "Event not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      BODY
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
      );

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

    const coverImageAssetId =
      getString(
        body.coverImageAssetId
      );

    const coverImageAlt =
      getString(
        body.coverImageAlt
      );

    const capacity =
      getOptionalNumber(
        body.capacity
      );

    const price =
      getOptionalNumber(
        body.price
      );

    const currency =
      getString(
        body.currency
      );

    const onlinePaymentsEnabled =
      body.onlinePaymentsEnabled ===
      true;

    const registrationStatus =
      getString(
        body.registrationStatus
      );

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
                  .slice(0, 12),

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
      currency !== "CZK" &&
      currency !== "EUR"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid currency.",
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
      typeof price !==
        "number" ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid ticket price.",
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
      SLUG COLLISION
    */

    const duplicate =
      await client.fetch<{
        _id: string;
      } | null>(
        `
          *[
            _type == "event"
            && slug.current == $slug
            && _id != $eventId
          ][0] {
            _id
          }
        `,
        {
          slug,

          eventId:
            existingEvent._id,
        }
      );

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "Another event already uses this slug.",
        },
        {
          status: 409,
        }
      );
    }

    /*
      PATCH
    */

    const writeClient =
      client.withConfig({
        token:
          writeToken,

        useCdn:
          false,
      });

    const setFields:
      Record<
        string,
        unknown
      > = {
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

        description,

        price,
        currency,

        onlinePaymentsEnabled,

        registrationStatus,
      };

    const unsetFields:
      string[] = [];

    if (venue) {
      setFields.venue =
        venue;
    } else {
      unsetFields.push(
        "venue"
      );
    }

    if (address) {
      setFields.address =
        address;
    } else {
      unsetFields.push(
        "address"
      );
    }

    if (fullDescription) {
      setFields.fullDescription =
        createPortableText(
          fullDescription
        );
    } else {
      unsetFields.push(
        "fullDescription"
      );
    }

    if (
      coverImageAssetId
    ) {
      setFields.coverImage = {
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
      };
    } else {
      unsetFields.push(
        "coverImage"
      );
    }

    if (
      gallery.length >
      0
    ) {
      setFields.gallery =
        gallery;
    } else {
      unsetFields.push(
        "gallery"
      );
    }

    if (
      typeof capacity ===
      "number"
    ) {
      setFields.capacity =
        capacity;
    } else {
      unsetFields.push(
        "capacity"
      );
    }

    if (
      highlights.length >
      0
    ) {
      setFields.highlights =
        highlights;
    } else {
      unsetFields.push(
        "highlights"
      );
    }

    if (
      registrationUrl
    ) {
      setFields.registrationUrl =
        registrationUrl;
    } else {
      unsetFields.push(
        "registrationUrl"
      );
    }

    if (
      registrationDeadline
    ) {
      setFields.registrationDeadline =
        registrationDeadline;
    } else {
      unsetFields.push(
        "registrationDeadline"
      );
    }

    if (
      registrationNote
    ) {
      setFields.registrationNote =
        registrationNote;
    } else {
      unsetFields.push(
        "registrationNote"
      );
    }

    let patch =
      writeClient
        .patch(
          existingEvent._id
        )
        .set(
          setFields
        );

    if (
      unsetFields.length >
      0
    ) {
      patch =
        patch.unset(
          unsetFields
        );
    }

    const updated =
      await patch.commit();

    return NextResponse.json({
      success: true,

      event: {
        _id:
          updated._id,

        title:
          updated.title,

        slug:
          updated.slug
            ?.current,
      },
    });
  } catch (error) {
    console.error(
      "Admin event update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not update event.",
      },
      {
        status: 500,
      }
    );
  }
}
