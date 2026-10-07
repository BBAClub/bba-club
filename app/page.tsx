import HomePageClient from "@/components/HomePageClient";

import {
  client,
} from "@/sanity/lib/client";

import {
  EVENTS_QUERY,
  HOMEPAGE_SETTINGS_QUERY,
  PLACES_QUERY,
} from "@/sanity/lib/queries";

import type {
  Event,
} from "@/data/events";

import type {
  Place,
} from "@/data/places";

export const dynamic =
  "force-dynamic";

type SanityEvent = {
  _id: string;

  title: string;
  slug: string;

  label?: string;

  status?:
    | "upcoming"
    | "past";

  date?: string;

  time?: string;
  location?: string;

  venue?: string;
  address?: string;

  description?: string;

  coverImageUrl?: string;
  coverImageAlt?: string;

  capacity?: number;

  price?: number;

  highlights?: string[];

  registrationStatus?:
    | "coming-soon"
    | "open"
    | "closed"
    | "full";

  registrationUrl?: string;

  registrationDeadline?: string;

  registrationNote?: string;
};

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

type SanityHomepageSettings = {
  heroImageUrl?: string;

  heroImageAlt?: string;
};

const monthNames = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function getGradient(
  label?: string
) {
  switch (label) {
    case "EXPLORE":
      return "from-[#164B64] via-[#1D596B] to-[#163449]";

    case "COMMUNITY":
      return "from-[#343064] via-[#243A66] to-[#10243A]";

    default:
      return "from-[#0057FF] via-[#164EA6] to-[#102B4C]";
  }
}

function getTodayInPrague() {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Europe/Prague",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day"
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    return new Date()
      .toISOString()
      .slice(
        0,
        10
      );
  }

  return `${year}-${month}-${day}`;
}

function convertSanityEvent(
  event: SanityEvent,
  today: string
): Event | null {
  if (
    !event.title ||
    !event.slug ||
    !event.date ||
    !event.time ||
    !event.location ||
    !event.description
  ) {
    return null;
  }

  const [
    ,
    month,
    day,
  ] =
    event.date.split(
      "-"
    );

  const monthIndex =
    Number(month) - 1;

  return {
    slug:
      event.slug,

    date:
      String(
        Number(day)
      ),

    month:
      monthNames[
        monthIndex
      ] ?? "",

    title:
      event.title,

    description:
      event.description,

    fullDescription: [
      event.description,
    ],

    location:
      event.location,

    venue:
      event.venue ??
      "Venue to be announced",

    address:
      event.address,

    time:
      event.time,

    price:
      event.price,

    coverImageUrl:
      event.coverImageUrl,

    coverImageAlt:
      event.coverImageAlt,

    gradient:
      getGradient(
        event.label
      ),

    label:
      event.label ??
      "EVENT",

    status:
      event.date >=
      today
        ? "upcoming"
        : "past",

    capacity:
      event.capacity,

    highlights:
      event.highlights,

    registration: {
      status:
        event.registrationStatus ??
        "coming-soon",

      url:
        event.registrationUrl,

      deadline:
        event.registrationDeadline,

      note:
        event.registrationNote,
    },
  };
}

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

export default async function Home() {
  const today =
    getTodayInPrague();

  const [
    sanityEvents,
    sanityPlaces,
    homepageSettings,
  ] =
    await Promise.all([
      client.fetch<
        SanityEvent[]
      >(
        EVENTS_QUERY
      ),

      client.fetch<
        SanityPlace[]
      >(
        PLACES_QUERY
      ),

      client.fetch<
        SanityHomepageSettings | null
      >(
        HOMEPAGE_SETTINGS_QUERY
      ),
    ]);

  const events =
    sanityEvents
      .slice()
      .sort(
        (a, b) =>
          (
            a.date ??
            ""
          ).localeCompare(
            b.date ??
              ""
          )
      )
      .map(
        (event) =>
          convertSanityEvent(
            event,
            today
          )
      )
      .filter(
        (
          event
        ): event is Event =>
          event !== null
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
    <HomePageClient
      events={events}
      places={places}
      heroImageUrl={
        homepageSettings
          ?.heroImageUrl
      }
      heroImageAlt={
        homepageSettings
          ?.heroImageAlt
      }
    />
  );
}