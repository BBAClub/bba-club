import {
  defineField,
  defineType,
} from "sanity";

export const teamMemberType =
  defineType({
    name: "teamMember",
    title: "Team Member",
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
        name: "role",
        title: "Role",
        type: "string",
        description:
          "For example President, Vice President or Treasurer.",
        validation: (Rule) =>
          Rule.required(),
      }),

      defineField({
        name: "description",
        title: "Description",
        type: "text",
        rows: 4,
        description:
          "Short description shown on the About page.",
      }),

      defineField({
        name: "profileImage",
        title: "Profile Image",
        type: "image",
        options: {
          hotspot: true,
        },
        fields: [
          defineField({
            name: "alt",
            title: "Alt Text",
            type: "string",
            description:
              "Short description of the photo for accessibility.",
          }),
        ],
      }),

      defineField({
        name: "linkedinUrl",
        title: "LinkedIn",
        type: "url",
        validation: (Rule) =>
          Rule.uri({
            scheme: [
              "http",
              "https",
            ],
          }),
      }),

      defineField({
        name: "instagramUrl",
        title: "Instagram",
        type: "url",
        validation: (Rule) =>
          Rule.uri({
            scheme: [
              "http",
              "https",
            ],
          }),
      }),

      defineField({
        name: "order",
        title: "Display Order",
        type: "number",
        description:
          "Lower numbers appear first.",
        initialValue: 100,
      }),

      defineField({
        name: "isActive",
        title: "Show on Website",
        type: "boolean",
        initialValue: true,
      }),
    ],

    preview: {
      select: {
        title: "name",
        subtitle: "role",
        media: "profileImage",
      },

      prepare({
        title,
        subtitle,
        media,
      }) {
        return {
          title,
          subtitle,
          media,
        };
      },
    },
  });