"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Category =
  | "Cafés"
  | "Food"
  | "Study"
  | "Nightlife"
  | "Outdoors";

type ExistingImage = {
  assetId: string;
  url: string;
  alt?: string;
};

export type AdminPlaceFormData = {
  name?: string;
  category?: Category;
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

  coverImage?: ExistingImage | null;
};

type Props = {
  mode?: "create" | "edit";
  currentId?: string;
  initialData?: AdminPlaceFormData;
};

const categories: Category[] = [
  "Cafés",
  "Food",
  "Study",
  "Nightlife",
  "Outdoors",
];

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]";

const MAX_IMAGE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

export default function AdminPlaceForm({
  mode = "create",
  currentId,
  initialData,
}: Props) {
  const router =
    useRouter();

  const editing =
    mode === "edit";

  const [name, setName] =
    useState(
      initialData?.name ?? ""
    );

  const [
    category,
    setCategory,
  ] =
    useState<Category>(
      initialData?.category ??
        "Cafés"
    );

  const [area, setArea] =
    useState(
      initialData?.area ?? ""
    );

  const [
    address,
    setAddress,
  ] =
    useState(
      initialData?.address ?? ""
    );

  const [
    description,
    setDescription,
  ] =
    useState(
      initialData?.description ??
        ""
    );

  const [price, setPrice] =
    useState(
      initialData?.price ?? ""
    );

  const [symbol, setSymbol] =
    useState(
      initialData?.symbol ?? ""
    );

  const [
    latitude,
    setLatitude,
  ] =
    useState(
      typeof initialData?.latitude ===
        "number"
        ? String(
            initialData.latitude
          )
        : ""
    );

  const [
    longitude,
    setLongitude,
  ] =
    useState(
      typeof initialData?.longitude ===
        "number"
        ? String(
            initialData.longitude
          )
        : ""
    );

  const [
    partner,
    setPartner,
  ] =
    useState(
      initialData?.partner ??
        false
    );

  const [
    promoCode,
    setPromoCode,
  ] =
    useState(
      initialData?.promoCode ??
        ""
    );

  const [
    promoText,
    setPromoText,
  ] =
    useState(
      initialData?.promoText ??
        ""
    );

  const [
    coverFile,
    setCoverFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    coverAssetId,
    setCoverAssetId,
  ] =
    useState(
      initialData?.coverImage
        ?.assetId ?? ""
    );

  const [
    existingCoverUrl,
    setExistingCoverUrl,
  ] =
    useState(
      initialData?.coverImage
        ?.url ?? ""
    );

  const [
    coverAlt,
    setCoverAlt,
  ] =
    useState(
      initialData?.coverImage
        ?.alt ?? ""
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState<string | null>(
      null
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    if (!coverFile) {
      setPreviewUrl(null);
      return;
    }

    const url =
      URL.createObjectURL(
        coverFile
      );

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(
        url
      );
    };
  }, [coverFile]);

  const displayedImage =
    previewUrl ||
    (coverAssetId
      ? existingCoverUrl
      : "");

  function handleImage(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !ALLOWED_TYPES.has(
        file.type
      )
    ) {
      setError(
        "Images must be JPG, PNG or WebP."
      );

      return;
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      setError(
        "Image can be a maximum of 10 MB."
      );

      return;
    }

    setError(null);
    setCoverFile(file);
  }

  async function uploadImage(
    file: File
  ) {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const response =
      await fetch(
        "/api/admin/places/assets",
        {
          method: "POST",
          body: formData,
        }
      );

    const data =
      (await response.json()) as {
        error?: string;

        asset?: {
          _id?: string;
          url?: string;
        };
      };

    if (
      !response.ok ||
      !data.asset?._id
    ) {
      throw new Error(
        data.error ??
          "Could not upload image."
      );
    }

    return {
      assetId:
        data.asset._id,

      url:
        data.asset.url ?? "",
    };
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (
      editing &&
      !currentId
    ) {
      setError(
        "Place ID is missing."
      );

      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let finalAssetId =
        coverAssetId;

      if (coverFile) {
        setUploading(true);

        const uploaded =
          await uploadImage(
            coverFile
          );

        finalAssetId =
          uploaded.assetId;

        setUploading(false);
      }

      const requestBody = {
        name,
        category,
        area,
        address,
        description,
        price,
        symbol,

        latitude:
          Number(latitude),

        longitude:
          Number(longitude),

        partner,

        promoCode:
          partner
            ? promoCode
            : "",

        promoText:
          partner
            ? promoText
            : "",

        coverImageAssetId:
          finalAssetId,

        coverImageAlt:
          coverAlt.trim(),
      };

      const endpoint =
        editing
          ? `/api/admin/places/${encodeURIComponent(
              currentId!
            )}`
          : "/api/admin/places";

      const response =
        await fetch(
          endpoint,
          {
            method:
              editing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody
              ),
          }
        );

      const data =
        (await response.json()) as {
          error?: string;
        };

      if (!response.ok) {
        setError(
          data.error ??
            "Could not save place."
        );

        return;
      }

      router.push(
        "/admin/places"
      );

      router.refresh();
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Could not save place."
      );
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  }

  const busy =
    submitting ||
    uploading;

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-8"
    >
      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <Section
        title="Basic information"
        description="Main information shown in Explore Prague."
      >
        <Field
          label="Place name"
          required
        >
          <input
            required
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
            placeholder="Café Example"
            className={
              inputClass
            }
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-3">
          <Field
            label="Category"
            required
          >
            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target
                    .value as Category
                )
              }
              className={
                inputClass
              }
            >
              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field
            label="Area"
            required
          >
            <input
              required
              value={area}
              onChange={(event) =>
                setArea(
                  event.target.value
                )
              }
              placeholder="Karlín"
              className={
                inputClass
              }
            />
          </Field>

          <Field
            label="Price"
            required
            hint="For example Free, €, €€."
          >
            <input
              required
              value={price}
              onChange={(event) =>
                setPrice(
                  event.target.value
                )
              }
              placeholder="€€"
              className={
                inputClass
              }
            />
          </Field>
        </div>

        <Field
          label="Address"
          required
        >
          <input
            required
            value={address}
            onChange={(event) =>
              setAddress(
                event.target.value
              )
            }
            placeholder="Full address"
            className={
              inputClass
            }
          />
        </Field>

        <Field
          label="Description"
          required
        >
          <textarea
            required
            rows={4}
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Why should students visit this place?"
            className={
              inputClass
            }
          />
        </Field>

        <Field
          label="Symbol"
          required
          hint="Emoji shown on the card and map."
        >
          <input
            required
            value={symbol}
            onChange={(event) =>
              setSymbol(
                event.target.value
              )
            }
            placeholder="☕"
            className={
              inputClass
            }
          />
        </Field>
      </Section>

      <Section
        title="Cover image"
        description="Main photo shown on Explore Prague."
      >
        {displayedImage ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071422]">
            <div className="aspect-video overflow-hidden">
              <img
                src={
                  displayedImage
                }
                alt=""
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex gap-2 p-4">
              <label className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#A9B5C3] hover:text-white">
                Change
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleImage
                  }
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setCoverFile(null);
                  setCoverAssetId("");
                  setExistingCoverUrl("");
                  setCoverAlt("");
                }}
                className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-[#071422]/60 p-8 text-center transition hover:border-[#5790FF]/60">
            <p className="text-sm font-semibold text-white">
              Upload cover image
            </p>

            <p className="mt-2 text-xs text-[#71869A]">
              JPG, PNG or WebP · max 10 MB
            </p>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                handleImage
              }
              className="hidden"
            />
          </label>
        )}

        <Field
          label="Alternative text"
        >
          <input
            value={coverAlt}
            onChange={(event) =>
              setCoverAlt(
                event.target.value
              )
            }
            placeholder="Describe the image"
            className={
              inputClass
            }
          />
        </Field>
      </Section>

      <Section
        title="Map location"
        description="Coordinates used for the Prague map."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Latitude"
            required
          >
            <input
              required
              type="number"
              step="any"
              min="-90"
              max="90"
              value={latitude}
              onChange={(event) =>
                setLatitude(
                  event.target.value
                )
              }
              placeholder="50.0755"
              className={
                inputClass
              }
            />
          </Field>

          <Field
            label="Longitude"
            required
          >
            <input
              required
              type="number"
              step="any"
              min="-180"
              max="180"
              value={longitude}
              onChange={(event) =>
                setLongitude(
                  event.target.value
                )
              }
              placeholder="14.4378"
              className={
                inputClass
              }
            />
          </Field>
        </div>
      </Section>

      <Section
        title="BBA Club partner"
        description="Optional partner discount or community benefit."
      >
        <label className="flex cursor-pointer gap-4 rounded-2xl border border-white/10 bg-[#071422]/60 p-4">
          <input
            type="checkbox"
            checked={partner}
            onChange={(event) =>
              setPartner(
                event.target.checked
              )
            }
            className="mt-1 h-4 w-4"
          />

          <div>
            <p className="text-sm font-semibold text-white">
              BBA Club Partner
            </p>

            <p className="mt-1 text-xs text-[#71869A]">
              Show the BBA Club Perk badge.
            </p>
          </div>
        </label>

        {partner && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Promo code"
            >
              <input
                value={promoCode}
                onChange={(event) =>
                  setPromoCode(
                    event.target.value
                  )
                }
                placeholder="BBACLUB10"
                className={
                  inputClass
                }
              />
            </Field>

            <Field
              label="Partner benefit"
            >
              <input
                value={promoText}
                onChange={(event) =>
                  setPromoText(
                    event.target.value
                  )
                }
                placeholder="10% off your order"
                className={
                  inputClass
                }
              />
            </Field>
          </div>
        )}
      </Section>

      <section className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            router.push(
              "/admin/places"
            )
          }
          className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-[#A9B5C3] hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[#0057FF] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2874FF] disabled:opacity-50"
        >
          {uploading
            ? "Uploading image..."
            : submitting
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Create place"}
        </button>
      </section>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-[#0B1A29] p-5 md:p-6">
      <div className="border-b border-white/10 pb-5">
        <h2 className="text-lg font-semibold text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-[#71869A]">
          {description}
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children:
    React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#A9B5C3]">
        {label}

        {required && (
          <span className="ml-1 text-[#5790FF]">
            *
          </span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-2 text-xs leading-5 text-[#53687D]">
          {hint}
        </p>
      )}
    </div>
  );
}
