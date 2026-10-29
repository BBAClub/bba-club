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
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getNumber(
  value: unknown
) {
  const number =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(number)
    ? number
    : undefined;
}

async function getAuth() {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      ),
    };
  }

  const writeToken =
    process.env
      .SANITY_API_WRITE_TOKEN;

  if (!writeToken) {
    return {
      error: NextResponse.json(
        {
          error:
            "Server configuration is incomplete.",
        },
        { status: 500 }
      ),
    };
  }

  return {
    writeClient:
      client.withConfig({
        token: writeToken,
        useCdn: false,
      }),
  };
}

export async function PATCH(
  request: Request,
  context: {
    params:
      Promise<{
        id: string;
      }>;
  }
) {
  try {
    const auth =
      await getAuth();

    if ("error" in auth) {
      return auth.error;
    }

    const { id } =
      await context.params;

    const existing =
      await client.fetch<{
        _id: string;
      } | null>(
        `
          *[
            _type == "place"
            && _id == $id
          ][0] {
            _id
          }
        `,
        { id }
      );

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Place not found.",
        },
        {
          status: 404,
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
      getString(body.category);

    const area =
      getString(body.area);

    const address =
      getString(body.address);

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
      typeof latitude !== "number" ||
      typeof longitude !== "number"
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
            && _id != $id
          ][0] {
            _id
          }
        `,
        {
          name,
          id,
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

    const setFields:
      Record<
        string,
        unknown
      > = {
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

    const unsetFields:
      string[] = [];

    if (
      partner &&
      promoCode
    ) {
      setFields.promoCode =
        promoCode;
    } else {
      unsetFields.push(
        "promoCode"
      );
    }

    if (
      partner &&
      promoText
    ) {
      setFields.promoText =
        promoText;
    } else {
      unsetFields.push(
        "promoText"
      );
    }

    if (coverImageAssetId) {
      setFields.coverImage = {
        _type: "image",

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

    let patch =
      auth.writeClient
        .patch(
          existing._id
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

      place: {
        _id:
          updated._id,

        name:
          updated.name,
      },
    });
  } catch (error) {
    console.error(
      "Admin place update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not update place.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params:
      Promise<{
        id: string;
      }>;
  }
) {
  try {
    const auth =
      await getAuth();

    if ("error" in auth) {
      return auth.error;
    }

    const { id } =
      await context.params;

    const place =
      await client.fetch<{
        _id: string;
        name?: string;
      } | null>(
        `
          *[
            _type == "place"
            && _id == $id
          ][0] {
            _id,
            name
          }
        `,
        { id }
      );

    if (!place) {
      return NextResponse.json(
        {
          error:
            "Place not found.",
        },
        {
          status: 404,
        }
      );
    }

    await auth.writeClient.delete(
      place._id
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Admin place deletion error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not delete place.",
      },
      {
        status: 500,
      }
    );
  }
}
