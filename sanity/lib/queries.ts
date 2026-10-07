export const EVENTS_QUERY = `
  *[
    _type == "event"
    && defined(slug.current)
  ]
  | order(date asc) {
    _id,
    title,
    "slug": slug.current,
    label,
    status,
    date,
    time,
    location,
    venue,
    address,
    description,

    "coverImageUrl": coverImage.asset->url,
    "coverImageAlt": coverImage.alt,

    capacity,
    price,
    highlights,
    registrationStatus,
    registrationUrl,
    registrationDeadline,
    registrationNote
  }
`;

export const EVENT_BY_SLUG_QUERY = `
  *[
    _type == "event"
    && slug.current == $slug
  ][0] {
    _id,
    title,
    "slug": slug.current,
    label,
    status,
    date,
    time,
    location,
    venue,
    address,
    description,

    fullDescription[] {
      _type,
      children[] {
        text
      }
    },

    "coverImageUrl": coverImage.asset->url,
    "coverImageAlt": coverImage.alt,

    gallery[] {
      "url": asset->url,
      alt
    },

    capacity,
    price,
    highlights,
    registrationStatus,
    registrationUrl,
    registrationDeadline,
    registrationNote,

    "confirmedRegistrations": count(
      *[
        _type == "eventRegistration"
        && event._ref == ^._id
        && status in [
          "confirmed",
          "checked-in"
        ]
      ]
    )
  }
`;

export const HOMEPAGE_SETTINGS_QUERY = `
  *[_type == "homepageSettings"][0] {
    "heroImageUrl": heroImage.asset->url,
    "heroImageAlt": heroImage.alt
  }
`;

export const PLACES_QUERY = `
  *[_type == "place"]
  | order(name asc) {
    _id,
    name,
    category,
    area,
    address,
    description,
    price,
    symbol,

    "coverImageUrl": coverImage.asset->url,
    "coverImageAlt": coverImage.alt,

    latitude,
    longitude,
    partner,
    promoCode,
    promoText
  }
`;

export const STUDY_RESOURCES_QUERY = `
  *[
    _type == "studyResource"
    && coalesce(
      isPublished,
      true
    ) == true
  ]
  | order(
      order asc,
      title asc
    ) {
    _id,
    title,

    "slug":
      slug.current,

    resourceType,
    description,
    course,
    tag,
    symbol,
    author,
    externalUrl,

    "fileUrl":
      file.asset->url,

    order,

    overview,

    tips[] {
      title,
      text
    },

    materials[] {
      title,
      description,
      symbol,
      url,

      "fileUrl":
        file.asset->url
    },

    exam {
      format,
      experience
    },

    links[] {
      title,
      description,
      url
    }
  }
`;

export const STUDY_RESOURCE_BY_SLUG_QUERY = `
  *[
    _type == "studyResource"
    && slug.current == $slug
    && coalesce(
      isPublished,
      true
    ) == true
  ][0] {
    _id,
    title,

    "slug":
      slug.current,

    resourceType,
    description,
    course,
    tag,
    symbol,
    author,
    externalUrl,

    "fileUrl":
      file.asset->url,

    overview,

    tips[] {
      title,
      text
    },

    materials[] {
      title,
      description,
      symbol,
      url,

      "fileUrl":
        file.asset->url
    },

    exam {
      format,
      experience
    },

    links[] {
      title,
      description,
      url
    },

    "relatedResources": *[
      _type == "studyResource"
      && _id != ^._id
      && course == ^.title

      && coalesce(
        isPublished,
        true
      ) == true

      && resourceType in [
        "Tip",
        "Material",
        "Test"
      ]
    ]
    | order(
        order asc,
        title asc
      ) {
      _id,
      title,
      resourceType,
      description,
      course,
      tipType,
      tag,
      symbol,
      author,
      externalUrl,

      "fileUrl":
        file.asset->url
    }
  }
`;