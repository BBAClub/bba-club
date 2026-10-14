import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import AdminDeleteEvent from "@/components/AdminDeleteEvent";

import AdminEventForm, {
  type AdminEventFormData,
} from "@/components/AdminEventForm";

import {
  client,
} from "@/sanity/lib/client";

export const dynamic =
  "force-dynamic";

type EventDocument = {
  title?: string;
  slug?: string;

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

  fullDescription?: {
    children?: {
      text?: string;
    }[];
  }[];

  coverImageAssetId?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;

  gallery?: {
    assetId?: string;
    url?: string;
    alt?: string;
  }[];

  capacity?: number;

  price?: number;

  currency?:
    | "CZK"
    | "EUR";

  onlinePaymentsEnabled?: boolean;

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

const ADMIN_EVENT_QUERY = `
  *[
    _type == "event"
    && slug.current == $slug
  ][0] {
    title,

    "slug":
      slug.current,

    label,
    status,

    date,
    time,

    location,
    venue,
    address,

    description,

    fullDescription[] {
      children[] {
        text
      }
    },

    "coverImageAssetId":
      coverImage.asset._ref,

    "coverImageUrl":
      coverImage.asset->url,

    "coverImageAlt":
      coverImage.alt,

    gallery[] {
      "assetId":
        asset._ref,

      "url":
        asset->url,

      alt
    },

    capacity,

    price,
    currency,

    onlinePaymentsEnabled,

    highlights,

    registrationStatus,
    registrationUrl,
    registrationDeadline,
    registrationNote
  }
`;

function portableTextToPlainText(
  blocks?:
    EventDocument["fullDescription"]
) {
  if (!blocks) {
    return "";
  }

  return blocks
    .map(
      (block) =>
        (
          block.children ??
          []
        )
          .map(
            (child) =>
              child.text ??
              ""
          )
          .join("")
          .trim()
    )
    .filter(Boolean)
    .join("\n\n");
}

export default async function EditEventPage({
  params,
}: {
  params:
    Promise<{
      slug: string;
    }>;
}) {
  const {
    slug,
  } =
    await params;

  const event =
    await client.fetch<
      EventDocument | null
    >(
      ADMIN_EVENT_QUERY,
      {
        slug,
      }
    );

  if (
    !event ||
    !event.title ||
    !event.slug
  ) {
    notFound();
  }

  const initialData:
    AdminEventFormData = {
      title:
        event.title,

      slug:
        event.slug,

      label:
        event.label ??
        "",

      status:
        event.status ??
        "upcoming",

      date:
        event.date ??
        "",

      time:
        event.time ??
        "",

      location:
        event.location ??
        "",

      venue:
        event.venue ??
        "",

      address:
        event.address ??
        "",

      description:
        event.description ??
        "",

      fullDescription:
        portableTextToPlainText(
          event.fullDescription
        ),

      coverImage:
        event.coverImageAssetId &&
        event.coverImageUrl
          ? {
              assetId:
                event.coverImageAssetId,

              url:
                event.coverImageUrl,

              alt:
                event.coverImageAlt ??
                "",
            }
          : null,

      gallery:
        (
          event.gallery ??
          []
        )
          .filter(
            (
              image
            ) =>
              Boolean(
                image.assetId &&
                  image.url
              )
          )
          .map(
            (
              image
            ) => ({
              assetId:
                image.assetId!,

              url:
                image.url!,

              alt:
                image.alt ??
                "",
            })
          ),

      capacity:
        event.capacity,

      price:
        event.price ??
        0,

      currency:
        event.currency ===
        "EUR"
          ? "EUR"
          : "CZK",

      onlinePaymentsEnabled:
        event.onlinePaymentsEnabled ??
        false,

      highlights:
        event.highlights ??
        [],

      registrationStatus:
        event.registrationStatus ??
        "coming-soon",

      registrationUrl:
        event.registrationUrl ??
        "",

      registrationDeadline:
        event.registrationDeadline ??
        "",

      registrationNote:
        event.registrationNote ??
        "",
    };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#71869A] transition hover:text-white"
        >
          ← Back to events
        </Link>

        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8EC5FF]">
          Events
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white md:text-5xl">
          Edit event
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8EA0B3]">
          Update event details, media,
          registration and payment settings.
        </p>
      </div>

      <div className="max-w-5xl">
        <AdminEventForm
          mode="edit"
          currentSlug={
            event.slug
          }
          initialData={
            initialData
          }
        />

        <AdminDeleteEvent
          title={
            event.title
          }
          slug={
            event.slug
          }
        />
      </div>
    </div>
  );
}
