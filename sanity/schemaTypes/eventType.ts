import {
  defineArrayMember,
  defineField,
  defineType,
} from "sanity";

export const eventType = defineType({
  name: "event",
  title: "Event",
  type: "document",

  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) =>
        rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) =>
        rule.required(),
    }),

    defineField({
      name: "label",
      title: "Category / Label",
      type: "string",
      description:
        "For example SOCIAL, EXPLORE or COMMUNITY.",
      validation: (rule) =>
        rule.required(),
    }),

    defineField({
      name: "status",
      title: "Event Status",
      type: "string",
      initialValue: "upcoming",
      options: {
        list: [
          {
            title: "Upcoming",
            value: "upcoming",
          },
          {
            title: "Past",
            value: "past",
          },
        ],
        layout: "radio",
      },
      validation: (rule) =>
        rule.required(),
    }),

    defineField({
      name: "date",
      title: "Date",
      type: "date",
      validation: (rule) =>
        rule.required(),
    }),

    defineField({
      name: "time",
      title: "Time",
      type: "string",
      description:
        "Example: 19:00",
      validation: (rule) =>
        rule.required(),
    }),

    defineField({
      name: "location",
      title: "Location",
      type: "string",
      description:
        "Example: Prague 1",
      validation: (rule) =>
        rule.required(),
    }),

    defineField({
      name: "venue",
      title: "Venue",
      type: "string",
      description:
        "Specific venue or 'Venue to be announced'.",
    }),

    defineField({
      name: "address",
      title: "Address",
      type: "string",
    }),

    defineField({
      name: "description",
      title: "Short Description",
      type: "text",
      rows: 3,
      description:
        "Used on event cards and overview pages.",
      validation: (rule) =>
        rule.required(),
    }),

    defineField({
      name: "fullDescription",
      title: "Full Description",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
        }),
      ],
      description:
        "Longer description shown on the event detail page.",
    }),

    defineField({
      name: "capacity",
      title: "Capacity",
      type: "number",
      validation: (rule) =>
        rule.min(1).integer(),
    }),

    defineField({
      name: "price",
      title: "Ticket Price (CZK)",
      type: "number",
      description:
        "Price per person in CZK. Enter 0 for a free event.",
      initialValue: 0,
      validation: (rule) =>
        rule
          .required()
          .min(0)
          .integer(),
    }),

    defineField({
      name: "highlights",
      title: "What to Expect",
      type: "array",
      of: [
        defineArrayMember({
          type: "string",
        }),
      ],
    }),

    defineField({
      name: "registrationStatus",
      title: "Registration Status",
      type: "string",
      initialValue: "coming-soon",
      options: {
        list: [
          {
            title: "Coming soon",
            value: "coming-soon",
          },
          {
            title: "Open",
            value: "open",
          },
          {
            title: "Closed",
            value: "closed",
          },
          {
            title: "Full",
            value: "full",
          },
        ],
        layout: "radio",
      },
      validation: (rule) =>
        rule.required(),
    }),

    defineField({
      name: "registrationUrl",
      title: "Registration URL",
      type: "url",
      hidden: ({document}) =>
        document?.registrationStatus !==
        "open",
    }),

    defineField({
      name: "registrationDeadline",
      title: "Registration Deadline",
      type: "datetime",
    }),

    defineField({
      name: "registrationNote",
      title: "Registration Note",
      type: "text",
      rows: 3,
    }),
  ],

  preview: {
    select: {
      title: "title",
      date: "date",
      status: "status",
      price: "price",
    },

    prepare({
      title,
      date,
      status,
      price,
    }) {
      const formattedPrice =
        price === 0
          ? "Free"
          : typeof price === "number"
            ? `${price} CZK`
            : undefined;

      return {
        title,
        subtitle: [
          date,
          status,
          formattedPrice,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    },
  },
});