import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import AdminPlaceForm, {
  type AdminPlaceFormData,
} from "@/components/AdminPlaceForm";

import AdminDeletePlace from "@/components/AdminDeletePlace";

import {
  client,
} from "@/sanity/lib/client";

export const dynamic =
  "force-dynamic";

type PlaceDocument = {
  _id: string;

  name?: string;

  category?:
    | "Cafés"
    | "Food"
    | "Study"
    | "Nightlife"
    | "Outdoors";

  area?: string;
  address?: string;
  description?: string;
  price?: string;
  symbol?: string;

  latitude?: number;
  longitude?: number;

  partner?: boolean;
  promoCode?: string;
  promoText?: string;

  coverImageAssetId?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
};

const ADMIN_PLACE_QUERY = `
  *[
    _type == "place"
    && _id == $id
  ][0] {
    _id,
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
    promoCode,
    promoText,

    "coverImageAssetId":
      coverImage.asset._ref,

    "coverImageUrl":
      coverImage.asset->url,

    "coverImageAlt":
      coverImage.alt
  }
`;

export default async function EditPlacePage({
  params,
}: {
  params:
    Promise<{
      id: string;
    }>;
}) {
  const {
    id,
  } =
    await params;

  const place =
    await client.fetch<
      PlaceDocument | null
    >(
      ADMIN_PLACE_QUERY,
      {
        id,
      }
    );

  if (
    !place ||
    !place.name
  ) {
    notFound();
  }

  const initialData:
    AdminPlaceFormData = {
      name:
        place.name,

      category:
        place.category ??
        "Cafés",

      area:
        place.area ?? "",

      address:
        place.address ?? "",

      description:
        place.description ?? "",

      price:
        place.price ?? "",

      symbol:
        place.symbol ?? "",

      latitude:
        place.latitude,

      longitude:
        place.longitude,

      partner:
        place.partner ??
        false,

      promoCode:
        place.promoCode ?? "",

      promoText:
        place.promoText ?? "",

      coverImage:
        place.coverImageAssetId &&
        place.coverImageUrl
          ? {
              assetId:
                place.coverImageAssetId,

              url:
                place.coverImageUrl,

              alt:
                place.coverImageAlt ??
                "",
            }
          : null,
    };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/places"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#71869A] transition hover:text-white"
        >
          ← Back to places
        </Link>

        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8EC5FF]">
          Places
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white md:text-5xl">
          Edit place
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8EA0B3]">
          Update this recommendation
          in Explore Prague.
        </p>
      </div>

      <div className="max-w-5xl">
        <AdminPlaceForm
          mode="edit"
          currentId={
            place._id
          }
          initialData={
            initialData
          }
        />

        <AdminDeletePlace
          id={
            place._id
          }
          name={
            place.name
          }
        />
      </div>
    </div>
  );
}
