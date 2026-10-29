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

const categories = [
  "Cafés",
  "Food",
  "Study",
  "Nightlife",
  "Outdoors",
];

type PlaceBody = {
  name?: unknown;
  category?: unknown;
  area?: unknown;
  address?: unknown;
  description?: unknown;
  price?: unknown;
  symbol?: unknown;

  latitude?: unknown;
  longitude?: unknown;

  partner?: unknown;
  promoCode?: unknown;
  promoText?: unknown;

  coverImageAssetId?: unknown;
  coverImageAlt?: unknown;
};

function getString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function getNumber(
  value: unknown
) {
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

export async function POST(
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

    let body:
      PlaceBody;

    try {
      body =
        (await request.json()) as
          PlaceBody;
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

    const name =
      getString(body.name);

    const category =
      getString(
        body.category
      );

    const area =
      getString(body.area);

    const address =
      getString(
        body.address
      );

    const description =
      getString(
        body.description
      );

    const price =
      getString(body.price);

    const symbol =
      getString(body.symbol);

    const latitude =
      getNumber(
        body.latitude
      );

    const longitude =
      getNumber(
        body.longitude
      );

    const partner =
      body.partner === true;

    const promoCode =
      getString(
        body.promoCode
      );

    const promoText =
      getString(
        body.promoText
      );

    const coverImageAssetId =
      getString(
        body.coverImageAssetId
      );

    const coverImageAlt =
      getString(
        body.coverImageAlt
      );

    if (
      !name ||
      !category ||
      !area ||
      !address ||
      !description ||
      !price ||
      !symbol ||
      typeof latitude !==
        "number" ||
      typeof longitude !==
        "number"
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
      !categories.includes(
        category
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid place category.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid GPS coordinates.",
        },
        {
          status: 400,
        }
      );
    }

    const duplicate =
      await client.fetch<{
        _id: string;
      } | null>(
        `
          *[
            _type == "place"
            && lower(name) == lower($name)
          ][0] {
            _id
          }
        `,
        {
          name,
        }
      );

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "A place with this name already exists.",
        },
        {
          status: 409,
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

    const document: {
      _type: string;
      [key: string]: unknown;
    } = {
        _type:
          "place",

        name,
        category,
        area,
        address,
        description,
        price,
        symbol,

        latitude,
        longitude,

        partner,
      };

    if (partner) {
      if (promoCode) {
        document.promoCode =
          promoCode;
      }

      if (promoText) {
        document.promoText =
          promoText;
      }
    }

    if (
      coverImageAssetId
    ) {
      document.coverImage = {
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
    }

    const created =
      await writeClient.create(
        document
      );

    return NextResponse.json(
      {
        success: true,

        place: {
          _id:
            created._id,

          name:
            created.name,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Admin place creation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not create place.",
      },
      {
        status: 500,
      }
    );
  }
}
