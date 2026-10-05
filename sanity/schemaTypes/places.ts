import {
  defineField,
  defineType,
} from "sanity";

export const placeType = defineType({
  name: "place",
  title: "Place",
  type: "document",

  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) =>
        Rule.required(),
    }),

    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          {
            title: "Cafés",
            value: "Cafés",
          },
          {
            title: "Food",
            value: "Food",
          },
          {
            title: "Study",
            value: "Study",
          },
          {
            title: "Nightlife",
            value: "Nightlife",
          },
          {
            title: "Outdoors",
            value: "Outdoors",
          },
        ],
        layout: "dropdown",
      },
      validation: (Rule) =>
        Rule.required(),
    }),

    defineField({
      name: "area",
      title: "Area",
      type: "string",
      description:
        "For example Letná, Karlín or Dejvice.",
      validation: (Rule) =>
        Rule.required(),
    }),

    defineField({
      name: "address",
      title: "Address",
      type: "string",
      description:
        "Full address shown to students.",
      validation: (Rule) =>
        Rule.required(),
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      validation: (Rule) =>
        Rule.required(),
    }),

    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description:
        "For example Free, €, €€ or €€€.",
      validation: (Rule) =>
        Rule.required(),
    }),

    defineField({
      name: "symbol",
      title: "Symbol",
      type: "string",
      description:
        "Emoji displayed on the place card and map marker.",
      validation: (Rule) =>
        Rule.required(),
    }),

    defineField({
      name: "latitude",
      title: "Latitude",
      type: "number",
      description:
        "GPS latitude, for example 50.097.",
      validation: (Rule) =>
        Rule.required()
          .min(-90)
          .max(90),
    }),

    defineField({
      name: "longitude",
      title: "Longitude",
      type: "number",
      description:
        "GPS longitude, for example 14.423.",
      validation: (Rule) =>
        Rule.required()
          .min(-180)
          .max(180),
    }),

    defineField({
      name: "partner",
      title: "BBA Club Partner",
      type: "boolean",
      initialValue: false,
    }),

    defineField({
      name: "promoCode",
      title: "Promo Code",
      type: "string",
      hidden: ({ parent }) =>
        !parent?.partner,
    }),

    defineField({
      name: "promoText",
      title: "Partner Benefit",
      type: "string",
      description:
        "For example: 10% off your order.",
      hidden: ({ parent }) =>
        !parent?.partner,
    }),
  ],

  preview: {
    select: {
      title: "name",
      category: "category",
      area: "area",
      partner: "partner",
      symbol: "symbol",
    },

    prepare({
      title,
      category,
      area,
      partner,
      symbol,
    }) {
      return {
        title: `${symbol ?? "📍"} ${title}`,
        subtitle: `${category} · ${area}${
          partner ? " · Partner" : ""
        }`,
      };
    },
  },
});