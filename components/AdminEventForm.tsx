"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Currency =
  | "CZK"
  | "EUR";

type EventStatus =
  | "upcoming"
  | "past";

type RegistrationStatus =
  | "coming-soon"
  | "open"
  | "closed"
  | "full";

type GalleryImageDraft = {
  id: string;
  file: File;
  previewUrl: string;
  alt: string;
};

const MAX_IMAGE_SIZE =
  10 * 1024 * 1024;

const MAX_GALLERY_IMAGES =
  20;

const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

export default function AdminEventForm() {
  const router =
    useRouter();

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    slug,
    setSlug,
  ] =
    useState("");

  const [
    label,
    setLabel,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState<EventStatus>(
      "upcoming"
    );

  const [
    date,
    setDate,
  ] =
    useState("");

  const [
    time,
    setTime,
  ] =
    useState("");

  const [
    location,
    setLocation,
  ] =
    useState("");

  const [
    venue,
    setVenue,
  ] =
    useState("");

  const [
    address,
    setAddress,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    fullDescription,
    setFullDescription,
  ] =
    useState("");

  /*
    COVER IMAGE
  */

  const [
    coverImage,
    setCoverImage,
  ] =
    useState<
      File | null
    >(null);

  const [
    coverImagePreview,
    setCoverImagePreview,
  ] =
    useState<
      string | null
    >(null);

  const [
    coverImageAlt,
    setCoverImageAlt,
  ] =
    useState("");

  const [
    draggingCover,
    setDraggingCover,
  ] =
    useState(false);

  /*
    GALLERY
  */

  const [
    galleryImages,
    setGalleryImages,
  ] =
    useState<
      GalleryImageDraft[]
    >([]);

  const galleryImagesRef =
    useRef<
      GalleryImageDraft[]
    >([]);

  const [
    draggingGallery,
    setDraggingGallery,
  ] =
    useState(false);

  /*
    OTHER FIELDS
  */

  const [
    capacity,
    setCapacity,
  ] =
    useState("");

  const [
    price,
    setPrice,
  ] =
    useState("0");

  const [
    currency,
    setCurrency,
  ] =
    useState<Currency>(
      "CZK"
    );

  const [
    onlinePaymentsEnabled,
    setOnlinePaymentsEnabled,
  ] =
    useState(false);

  const [
    highlights,
    setHighlights,
  ] =
    useState("");

  const [
    registrationStatus,
    setRegistrationStatus,
  ] =
    useState<RegistrationStatus>(
      "coming-soon"
    );

  const [
    registrationUrl,
    setRegistrationUrl,
  ] =
    useState("");

  const [
    registrationDeadline,
    setRegistrationDeadline,
  ] =
    useState("");

  const [
    registrationNote,
    setRegistrationNote,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    uploadingImages,
    setUploadingImages,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  /*
    COVER PREVIEW
  */

  useEffect(() => {
    if (!coverImage) {
      setCoverImagePreview(
        null
      );

      return;
    }

    const previewUrl =
      URL.createObjectURL(
        coverImage
      );

    setCoverImagePreview(
      previewUrl
    );

    return () => {
      URL.revokeObjectURL(
        previewUrl
      );
    };
  }, [
    coverImage,
  ]);

  /*
    GALLERY PREVIEW CLEANUP
  */

  useEffect(() => {
    galleryImagesRef.current =
      galleryImages;
  }, [
    galleryImages,
  ]);

  useEffect(() => {
    return () => {
      galleryImagesRef.current.forEach(
        (
          image
        ) => {
          URL.revokeObjectURL(
            image.previewUrl
          );
        }
      );
    };
  }, []);

  function validateImage(
    file: File
  ) {
    if (
      !ALLOWED_IMAGE_TYPES.has(
        file.type
      )
    ) {
      return "Images must be JPG, PNG or WebP.";
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      return "Each image can be a maximum of 10 MB.";
    }

    if (
      file.size <= 0
    ) {
      return "One of the selected images is empty.";
    }

    return null;
  }

  /*
    COVER
  */

  function setCoverFile(
    file:
      File | null
  ) {
    setError(null);

    if (!file) {
      setCoverImage(
        null
      );

      return;
    }

    const imageError =
      validateImage(
        file
      );

    if (imageError) {
      setError(
        imageError
      );

      return;
    }

    setCoverImage(
      file
    );
  }

  function handleCoverInput(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] ??
      null;

    setCoverFile(
      file
    );

    event.target.value =
      "";
  }

  /*
    GALLERY
  */

  function addGalleryFiles(
    files:
      File[]
  ) {
    setError(null);

    if (
      files.length === 0
    ) {
      return;
    }

    if (
      galleryImages.length +
        files.length >
      MAX_GALLERY_IMAGES
    ) {
      setError(
        `A maximum of ${MAX_GALLERY_IMAGES} gallery images is allowed.`
      );

      return;
    }

    for (
      const file
      of files
    ) {
      const imageError =
        validateImage(
          file
        );

      if (imageError) {
        setError(
          imageError
        );

        return;
      }
    }

    const newImages =
      files.map(
        (file) => ({
          id:
            crypto.randomUUID(),

          file,

          previewUrl:
            URL.createObjectURL(
              file
            ),

          alt:
            "",
        })
      );

    setGalleryImages(
      (
        current
      ) => [
        ...current,
        ...newImages,
      ]
    );
  }

  function handleGalleryInput(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(
        event.target.files ??
          []
      );

    addGalleryFiles(
      files
    );

    event.target.value =
      "";
  }

  function removeGalleryImage(
    id: string
  ) {
    setGalleryImages(
      (
        current
      ) => {
        const image =
          current.find(
            (
              item
            ) =>
              item.id === id
          );

        if (image) {
          URL.revokeObjectURL(
            image.previewUrl
          );
        }

        return current.filter(
          (
            item
          ) =>
            item.id !== id
        );
      }
    );
  }

  function updateGalleryAlt(
    id: string,
    alt: string
  ) {
    setGalleryImages(
      (
        current
      ) =>
        current.map(
          (
            image
          ) =>
            image.id === id
              ? {
                  ...image,
                  alt,
                }
              : image
        )
    );
  }

  /*
    SANITY ASSET UPLOAD
  */

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
        "/api/admin/events/assets",
        {
          method:
            "POST",

          body:
            formData,
        }
      );

    const data =
      (await response.json()) as {
        success?: boolean;

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

    return data.asset._id;
  }

  /*
    SUBMIT
  */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      submitting
    ) {
      return;
    }

    setSubmitting(
      true
    );

    setError(
      null
    );

    try {
      /*
        UPLOAD MEDIA
      */

      let coverImageAssetId:
        string | undefined;

      const uploadedGallery: {
        assetId: string;
        alt: string;
      }[] = [];

      if (
        coverImage ||
        galleryImages.length >
          0
      ) {
        setUploadingImages(
          true
        );

        try {
          if (
            coverImage
          ) {
            coverImageAssetId =
              await uploadImage(
                coverImage
              );
          }

          for (
            const image
            of galleryImages
          ) {
            const assetId =
              await uploadImage(
                image.file
              );

            uploadedGallery.push(
              {
                assetId,

                alt:
                  image.alt.trim(),
              }
            );
          }
        } finally {
          setUploadingImages(
            false
          );
        }
      }

      /*
        CREATE EVENT
      */

      const response =
        await fetch(
          "/api/admin/events",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                title,
                slug,
                label,
                status,

                date,
                time,

                location,
                venue,
                address,

                description,
                fullDescription,

                coverImageAssetId,

                coverImageAlt:
                  coverImageAlt.trim(),

                gallery:
                  uploadedGallery,

                capacity:
                  capacity.trim()
                    ? Number(
                        capacity
                      )
                    : undefined,

                price:
                  price.trim()
                    ? Number(
                        price
                      )
                    : 0,

                currency,

                onlinePaymentsEnabled,

                highlights:
                  highlights
                    .split("\n")
                    .map(
                      (
                        item
                      ) =>
                        item.trim()
                    )
                    .filter(Boolean),

                registrationStatus,

                registrationUrl,

                registrationDeadline:
                  registrationDeadline
                    ? new Date(
                        registrationDeadline
                      ).toISOString()
                    : "",

                registrationNote,
              }),
          }
        );

      const data =
        (await response.json()) as {
          success?: boolean;

          error?: string;

          event?: {
            slug?: string;
          };
        };

      if (
        !response.ok
      ) {
        setError(
          data.error ??
            "Could not create event."
        );

        return;
      }

      router.push(
        "/admin/events"
      );

      router.refresh();
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Could not create event."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  const busy =
    submitting ||
    uploadingImages;

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
        description="Main information shown across the BBA Club website."
      >
        <Field
          label="Event title"
          required
        >
          <input
            required

            value={
              title
            }

            onChange={(
              event
            ) =>
              setTitle(
                event.target
                  .value
              )
            }

            placeholder="Career Boost: CV & LinkedIn Edition"

            className={
              inputClass
            }
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Slug"

            hint="Leave blank to generate it automatically."
          >
            <input
              value={
                slug
              }

              onChange={(
                event
              ) =>
                setSlug(
                  event.target
                    .value
                )
              }

              placeholder="career-boost-cv-linkedin"

              className={
                inputClass
              }
            />
          </Field>

          <Field
            label="Category / label"
            required
          >
            <input
              required

              value={
                label
              }

              onChange={(
                event
              ) =>
                setLabel(
                  event.target
                    .value
                )
              }

              placeholder="CAREER"

              className={
                inputClass
              }
            />
          </Field>
        </div>

        <Field
          label="Short description"
          required

          hint="Used on event cards and overview pages."
        >
          <textarea
            required
            rows={3}

            value={
              description
            }

            onChange={(
              event
            ) =>
              setDescription(
                event.target
                  .value
              )
            }

            placeholder="A short introduction to the event."

            className={
              inputClass
            }
          />
        </Field>

        <Field
          label="Full description"

          hint="Separate paragraphs with an empty line."
        >
          <textarea
            rows={8}

            value={
              fullDescription
            }

            onChange={(
              event
            ) =>
              setFullDescription(
                event.target
                  .value
              )
            }

            placeholder="Write the full event description here..."

            className={
              inputClass
            }
          />
        </Field>
      </Section>

      <Section
        title="Cover image"
        description="Main visual used on event cards and the event detail page."
      >
        {!coverImagePreview ? (
          <div
            onDragEnter={(
              event
            ) => {
              event.preventDefault();

              setDraggingCover(
                true
              );
            }}

            onDragOver={(
              event
            ) => {
              event.preventDefault();

              setDraggingCover(
                true
              );
            }}

            onDragLeave={(
              event
            ) => {
              event.preventDefault();

              setDraggingCover(
                false
              );
            }}

            onDrop={(
              event
            ) => {
              event.preventDefault();

              setDraggingCover(
                false
              );

              const file =
                event.dataTransfer
                  .files?.[0] ??
                null;

              setCoverFile(
                file
              );
            }}

            className={
              draggingCover
                ? "rounded-2xl border border-dashed border-[#5790FF] bg-[#0057FF]/10 p-8 text-center transition"
                : "rounded-2xl border border-dashed border-white/15 bg-[#071422]/60 p-8 text-center transition hover:border-[#5790FF]/60 hover:bg-[#0057FF]/[0.04]"
            }
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0057FF]/10 text-xl text-[#5790FF]">
              ↑
            </div>

            <p className="mt-4 text-sm font-semibold text-white">
              Upload cover image
            </p>

            <p className="mt-2 text-xs leading-5 text-[#71869A]">
              Drag and drop an image
              here or choose a file.
            </p>

            <p className="mt-1 text-[10px] text-[#53687D]">
              JPG, PNG or WebP · max
              10 MB
            </p>

            <label className="mt-5 inline-flex cursor-pointer rounded-xl bg-[#0057FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2874FF]">
              Choose image

              <input
                type="file"

                accept="image/jpeg,image/png,image/webp"

                onChange={
                  handleCoverInput
                }

                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071422]">
            <div className="relative aspect-video overflow-hidden bg-[#091725]">
              <img
                src={
                  coverImagePreview
                }

                alt=""

                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071422]/90 to-transparent p-4 pt-16">
                <p className="truncate text-xs text-[#A9B5C3]">
                  {
                    coverImage
                      ?.name
                  }
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-semibold text-white">
                  Cover image
                  selected
                </p>

                <p className="mt-1 text-[10px] text-[#53687D]">
                  {coverImage
                    ? `${(
                        coverImage.size /
                        1024 /
                        1024
                      ).toFixed(
                        2
                      )} MB`
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#A9B5C3] transition hover:border-white/20 hover:text-white">
                  Change

                  <input
                    type="file"

                    accept="image/jpeg,image/png,image/webp"

                    onChange={
                      handleCoverInput
                    }

                    className="hidden"
                  />
                </label>

                <button
                  type="button"

                  onClick={() => {
                    setCoverImage(
                      null
                    );

                    setCoverImageAlt(
                      ""
                    );
                  }}

                  className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        <Field
          label="Alternative text"

          hint="Describe the image briefly for accessibility."
        >
          <input
            value={
              coverImageAlt
            }

            onChange={(
              event
            ) =>
              setCoverImageAlt(
                event.target
                  .value
              )
            }

            placeholder="Career Boost event cover"

            className={
              inputClass
            }
          />
        </Field>
      </Section>

      <Section
        title="Event gallery"
        description="Optional additional photos shown on the event detail page."
      >
        <div
          onDragEnter={(
            event
          ) => {
            event.preventDefault();

            setDraggingGallery(
              true
            );
          }}

          onDragOver={(
            event
          ) => {
            event.preventDefault();

            setDraggingGallery(
              true
            );
          }}

          onDragLeave={(
            event
          ) => {
            event.preventDefault();

            setDraggingGallery(
              false
            );
          }}

          onDrop={(
            event
          ) => {
            event.preventDefault();

            setDraggingGallery(
              false
            );

            addGalleryFiles(
              Array.from(
                event.dataTransfer
                  .files ??
                  []
              )
            );
          }}

          className={
            draggingGallery
              ? "rounded-2xl border border-dashed border-[#5790FF] bg-[#0057FF]/10 p-6 text-center transition"
              : "rounded-2xl border border-dashed border-white/15 bg-[#071422]/60 p-6 text-center transition hover:border-[#5790FF]/60"
          }
        >
          <p className="text-sm font-semibold text-white">
            Add gallery photos
          </p>

          <p className="mt-2 text-xs leading-5 text-[#71869A]">
            Select multiple images
            or drag them here.
          </p>

          <p className="mt-1 text-[10px] text-[#53687D]">
            JPG, PNG or WebP · max
            10 MB each · up to{" "}
            {MAX_GALLERY_IMAGES} images
          </p>

          <label className="mt-4 inline-flex cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-[#A9B5C3] transition hover:border-white/20 hover:text-white">
            Choose images

            <input
              type="file"
              multiple

              accept="image/jpeg,image/png,image/webp"

              onChange={
                handleGalleryInput
              }

              className="hidden"
            />
          </label>
        </div>

        {galleryImages.length >
          0 && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-[#A9B5C3]">
                {
                  galleryImages.length
                }{" "}
                {galleryImages.length ===
                1
                  ? "image"
                  : "images"}{" "}
                selected
              </p>

              <button
                type="button"

                onClick={() => {
                  galleryImages.forEach(
                    (
                      image
                    ) => {
                      URL.revokeObjectURL(
                        image.previewUrl
                      );
                    }
                  );

                  setGalleryImages(
                    []
                  );
                }}

                className="text-xs font-semibold text-red-300 transition hover:text-red-200"
              >
                Remove all
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {galleryImages.map(
                (
                  image,
                  index
                ) => (
                  <div
                    key={
                      image.id
                    }

                    className="overflow-hidden rounded-2xl border border-white/10 bg-[#071422]"
                  >
                    <div className="relative aspect-video overflow-hidden bg-[#091725]">
                      <img
                        src={
                          image.previewUrl
                        }

                        alt=""

                        className="absolute inset-0 h-full w-full object-cover"
                      />

                      <div className="absolute left-3 top-3 rounded-full bg-[#071422]/80 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                        {index +
                          1}
                      </div>

                      <button
                        type="button"

                        onClick={() =>
                          removeGalleryImage(
                            image.id
                          )
                        }

                        className="absolute right-3 top-3 rounded-lg bg-[#071422]/80 px-2.5 py-1.5 text-[10px] font-semibold text-red-200 backdrop-blur transition hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="p-4">
                      <p className="truncate text-[10px] text-[#53687D]">
                        {
                          image.file
                            .name
                        }
                      </p>

                      <label className="mt-3 block text-xs font-semibold text-[#A9B5C3]">
                        Alternative text
                      </label>

                      <input
                        value={
                          image.alt
                        }

                        onChange={(
                          event
                        ) =>
                          updateGalleryAlt(
                            image.id,
                            event.target
                              .value
                          )
                        }

                        placeholder="Describe this photo"

                        className={
                          inputClass
                        }
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Date & location"
        description="When and where the event takes place."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Date"
            required
          >
            <input
              required
              type="date"

              value={
                date
              }

              onChange={(
                event
              ) =>
                setDate(
                  event.target
                    .value
                )
              }

              className={
                inputClass
              }
            />
          </Field>

          <Field
            label="Time"
            required
          >
            <input
              required
              type="time"

              value={
                time
              }

              onChange={(
                event
              ) =>
                setTime(
                  event.target
                    .value
                )
              }

              className={
                inputClass
              }
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Location"
            required

            hint="For example Prague 1 or VŠE."
          >
            <input
              required

              value={
                location
              }

              onChange={(
                event
              ) =>
                setLocation(
                  event.target
                    .value
                )
              }

              placeholder="VŠE"

              className={
                inputClass
              }
            />
          </Field>

          <Field
            label="Venue"
          >
            <input
              value={
                venue
              }

              onChange={(
                event
              ) =>
                setVenue(
                  event.target
                    .value
                )
              }

              placeholder="SB 213"

              className={
                inputClass
              }
            />
          </Field>
        </div>

        <Field
          label="Address"
        >
          <input
            value={
              address
            }

            onChange={(
              event
            ) =>
              setAddress(
                event.target
                  .value
              )
            }

            placeholder="nám. Winstona Churchilla 1938/4, Prague"

            className={
              inputClass
            }
          />
        </Field>
      </Section>

      <Section
        title="Capacity & tickets"
        description="Capacity, price and payment settings."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Field
            label="Capacity"
          >
            <input
              type="number"
              min="1"
              step="1"

              value={
                capacity
              }

              onChange={(
                event
              ) =>
                setCapacity(
                  event.target
                    .value
                )
              }

              placeholder="50"

              className={
                inputClass
              }
            />
          </Field>

          <Field
            label="Ticket price"
            required
          >
            <input
              required
              type="number"
              min="0"
              step="0.01"

              value={
                price
              }

              onChange={(
                event
              ) =>
                setPrice(
                  event.target
                    .value
                )
              }

              className={
                inputClass
              }
            />
          </Field>

          <Field
            label="Currency"
            required
          >
            <select
              value={
                currency
              }

              onChange={(
                event
              ) =>
                setCurrency(
                  event.target
                    .value as
                      Currency
                )
              }

              className={
                inputClass
              }
            >
              <option value="CZK">
                CZK
              </option>

              <option value="EUR">
                EUR
              </option>
            </select>
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-[#071422]/60 p-4">
          <input
            type="checkbox"

            checked={
              onlinePaymentsEnabled
            }

            onChange={(
              event
            ) =>
              setOnlinePaymentsEnabled(
                event.target
                  .checked
              )
            }

            className="mt-1 h-4 w-4"
          />

          <div>
            <p className="text-sm font-semibold text-white">
              Enable online
              payments
            </p>

            <p className="mt-1 text-xs leading-5 text-[#71869A]">
              Allows this event
              to use the payment
              gateway when the
              global payment
              switch is enabled.
            </p>
          </div>
        </label>
      </Section>

      <Section
        title="Registration"
        description="Control how registration behaves on the public event page."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Registration status"
            required
          >
            <select
              value={
                registrationStatus
              }

              onChange={(
                event
              ) =>
                setRegistrationStatus(
                  event.target
                    .value as
                      RegistrationStatus
                )
              }

              className={
                inputClass
              }
            >
              <option value="coming-soon">
                Coming soon
              </option>

              <option value="open">
                Open
              </option>

              <option value="closed">
                Closed
              </option>

              <option value="full">
                Full
              </option>
            </select>
          </Field>

          <Field
            label="Event status"
            required
          >
            <select
              value={
                status
              }

              onChange={(
                event
              ) =>
                setStatus(
                  event.target
                    .value as
                      EventStatus
                )
              }

              className={
                inputClass
              }
            >
              <option value="upcoming">
                Upcoming
              </option>

              <option value="past">
                Past
              </option>
            </select>
          </Field>
        </div>

        <Field
          label="External registration URL"

          hint="Usually leave empty when using BBA Club registration."
        >
          <input
            type="url"

            value={
              registrationUrl
            }

            onChange={(
              event
            ) =>
              setRegistrationUrl(
                event.target
                  .value
              )
            }

            placeholder="https://..."

            className={
              inputClass
            }
          />
        </Field>

        <Field
          label="Registration deadline"
        >
          <input
            type="datetime-local"

            value={
              registrationDeadline
            }

            onChange={(
              event
            ) =>
              setRegistrationDeadline(
                event.target
                  .value
              )
            }

            className={
              inputClass
            }
          />
        </Field>

        <Field
          label="Registration note"
        >
          <textarea
            rows={3}

            value={
              registrationNote
            }

            onChange={(
              event
            ) =>
              setRegistrationNote(
                event.target
                  .value
              )
            }

            placeholder="Optional note shown with registration information."

            className={
              inputClass
            }
          />
        </Field>
      </Section>

      <Section
        title="What to expect"
        description="Optional highlights shown on the event detail."
      >
        <Field
          label="Highlights"

          hint="Put one highlight on each line."
        >
          <textarea
            rows={5}

            value={
              highlights
            }

            onChange={(
              event
            ) =>
              setHighlights(
                event.target
                  .value
              )
            }

            placeholder={
              "Improve your CV\nOptimize your LinkedIn profile\nAsk questions directly to the speaker"
            }

            className={
              inputClass
            }
          />
        </Field>
      </Section>

      <section className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"

          onClick={() =>
            router.push(
              "/admin/events"
            )
          }

          disabled={
            busy
          }

          className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-[#A9B5C3] transition hover:border-white/20 hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"

          disabled={
            busy
          }

          className="rounded-xl bg-[#0057FF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2874FF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploadingImages
            ? "Uploading images..."
            : submitting
              ? "Creating event..."
              : "Create event"}
        </button>
      </section>
    </form>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#071422] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]";

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
