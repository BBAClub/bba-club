import ExploreClient from "./ExploreClient";

import type {
  Place,
} from "@/data/places";

import {
  client,
} from "@/sanity/lib/client";

import {
  PLACES_QUERY,
} from "@/sanity/lib/queries";

export const dynamic =
  "force-dynamic";

type SanityPlace = {
  _id: string;

  name: string;

  category:
    | "Cafés"
    | "Food"
    | "Study"
    | "Nightlife"
    | "Outdoors";

  area: string;

  address: string;

  description: string;

  price: string;

  symbol: string;

  coverImageUrl?: string;

  coverImageAlt?: string;

  latitude: number;

  longitude: number;

  partner?: boolean;

  promoCode?: string;

  promoText?: string;
};

function convertSanityPlace(
  place: SanityPlace
): Place | null {
  if (
    !place.name ||
    !place.category ||
    !place.area ||
    !place.address ||
    !place.description ||
    !place.price ||
    !place.symbol ||
    typeof place.latitude !==
      "number" ||
    typeof place.longitude !==
      "number"
  ) {
    return null;
  }

  return {
    name:
      place.name,

    category:
      place.category,

    area:
      place.area,

    address:
      place.address,

    description:
      place.description,

    price:
      place.price,

    symbol:
      place.symbol,

    coverImageUrl:
      place.coverImageUrl,

    coverImageAlt:
      place.coverImageAlt,

    latitude:
      place.latitude,

    longitude:
      place.longitude,

    partner:
      place.partner ??
      false,

    promoCode:
      place.promoCode,

    promoText:
      place.promoText,
  };
}

export default async function ExplorePage() {
  const sanityPlaces =
    await client.fetch<
      SanityPlace[]
    >(
      PLACES_QUERY
    );

  const places =
    sanityPlaces
      .map(
        convertSanityPlace
      )
      .filter(
        (
          place
        ): place is Place =>
          place !== null
      );

  return (
    <ExploreClient
      places={places}
    />
  );
}