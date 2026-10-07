import {
  defineField,
  defineType,
} from "sanity";

export const homepageSettingsType =
  defineType({
    name: "homepageSettings",
    title: "Homepage",
    type: "document",

    fields: [
      defineField({
        name: "heroImage",
        title: "Hero Image",
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
              "Short description of the hero image for accessibility.",
          }),
        ],
      }),
    ],

    preview: {
      select: {
        media:
          "heroImage",
      },

      prepare({
        media,
      }) {
        return {
          title:
            "Homepage",
          subtitle:
            "Homepage settings",
          media,
        };
      },
    },
  });