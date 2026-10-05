import {
  defineArrayMember,
  defineField,
  defineType,
} from "sanity";

const tipTypes = [
  {
    title:
      "General advice",

    value:
      "general",
  },

  {
    title:
      "Lectures & seminars",

    value:
      "lectures",
  },

  {
    title:
      "Assignments & projects",

    value:
      "assignments",
  },

  {
    title:
      "Exam / test",

    value:
      "exam",
  },

  {
    title:
      "Study strategy",

    value:
      "strategy",
  },

  {
    title:
      "Resources & materials",

    value:
      "resources",
  },
];

export const studyResourceType =
  defineType({
    name:
      "studyResource",

    title:
      "Study Resource",

    type:
      "document",

    fields: [
      defineField({
        name:
          "title",

        title:
          "Title",

        type:
          "string",

        validation:
          (
            Rule
          ) =>
            Rule.required(),
      }),

      defineField({
        name:
          "slug",

        title:
          "Slug",

        type:
          "slug",

        options: {
          source:
            "title",

          maxLength:
            96,
        },

        hidden:
          ({
            parent,
          }) =>
            parent
              ?.resourceType ===
            "Link",
      }),

      defineField({
        name:
          "resourceType",

        title:
          "Resource Type",

        type:
          "string",

        options: {
          list: [
            {
              title:
                "Course",

              value:
                "Course",
            },

            {
              title:
                "Tip",

              value:
                "Tip",
            },

            {
              title:
                "Material",

              value:
                "Material",
            },

            {
              title:
                "Test",

              value:
                "Test",
            },

            {
              title:
                "Useful Link",

              value:
                "Link",
            },
          ],

          layout:
            "dropdown",
        },

        validation:
          (
            Rule
          ) =>
            Rule.required(),
      }),

      defineField({
        name:
          "description",

        title:
          "Description",

        type:
          "text",

        rows:
          4,

        validation:
          (
            Rule
          ) =>
            Rule.required(),
      }),

      defineField({
        name:
          "course",

        title:
          "Related Course",

        type:
          "string",

        description:
          "For example Microeconomics or Statistics.",

        hidden:
          ({
            parent,
          }) =>
            parent
              ?.resourceType ===
            "Course",
      }),

      defineField({
        name:
          "tipType",

        title:
          "Tip Category",

        type:
          "string",

        hidden:
          ({
            parent,
          }) =>
            parent
              ?.resourceType !==
            "Tip",

        options: {
          list:
            tipTypes,

          layout:
            "dropdown",
        },
      }),

      defineField({
        name:
          "tag",

        title:
          "Tag",

        type:
          "string",

        description:
          "Label displayed on the resource card.",

        validation:
          (
            Rule
          ) =>
            Rule.required(),
      }),

      defineField({
        name:
          "symbol",

        title:
          "Symbol",

        type:
          "string",

        description:
          "Emoji displayed on the resource card.",

        validation:
          (
            Rule
          ) =>
            Rule.required(),
      }),

      defineField({
        name:
          "author",

        title:
          "Shared By",

        type:
          "string",

        description:
          "For example BBA students or Student submission.",
      }),

      defineField({
        name:
          "externalUrl",

        title:
          "External URL",

        type:
          "url",

        hidden:
          ({
            parent,
          }) =>
            parent
              ?.resourceType !==
              "Link" &&
            parent
              ?.resourceType !==
              "Material",

        validation:
          (
            Rule
          ) =>
            Rule.uri({
              scheme: [
                "http",
                "https",
              ],
            }),
      }),

      defineField({
        name:
          "file",

        title:
          "Uploaded File",

        type:
          "file",

        description:
          "Upload a PDF, image or other study material.",

        options: {
          storeOriginalFilename:
            true,

          accept:
            ".pdf,.png,.jpg,.jpeg,.webp",
        },

        hidden:
          ({
            parent,
          }) =>
            parent
              ?.resourceType !==
              "Material" &&
            parent
              ?.resourceType !==
              "Test",
      }),

      defineField({
        name:
          "order",

        title:
          "Display Order",

        type:
          "number",

        description:
          "Lower numbers appear first.",

        initialValue:
          100,
      }),

      /*
        INTERNAL PUBLICATION FLAG

        Hidden from normal Studio editing.
        Used by the admin moderation flow.
      */

      defineField({
        name:
          "isPublished",

        title:
          "Published on website",

        type:
          "boolean",

        initialValue:
          true,

        hidden:
          true,

        readOnly:
          true,
      }),

      /*
        COURSE CONTENT
      */

      defineField({
        name:
          "overview",

        title:
          "Course Overview",

        type:
          "text",

        rows:
          6,

        hidden:
          ({
            parent,
          }) =>
            parent
              ?.resourceType !==
            "Course",
      }),

      defineField({
        name:
          "tips",

        title:
          "Student Tips",

        type:
          "array",

        hidden:
          ({
            parent,
          }) =>
            parent
              ?.resourceType !==
            "Course",

        of: [
          defineArrayMember({
            type:
              "object",

            fields: [
              defineField({
                name:
                  "title",

                title:
                  "Title",

                type:
                  "string",

                validation:
                  (
                    Rule
                  ) =>
                    Rule.required(),
              }),

              defineField({
                name:
                  "text",

                title:
                  "Text",

                type:
                  "text",

                rows:
                  4,

                validation:
                  (
                    Rule
                  ) =>
                    Rule.required(),
              }),
            ],

            preview: {
              select: {
                title:
                  "title",

                subtitle:
                  "text",
              },
            },
          }),
        ],
      }),

      defineField({
        name:
          "materials",

        title:
          "Course Materials",

        type:
          "array",

        hidden:
          ({
            parent,
          }) =>
            parent
              ?.resourceType !==
            "Course",

        of: [
          defineArrayMember({
            type:
              "object",

            fields: [
              defineField({
                name:
                  "title",

                title:
                  "Title",

                type:
                  "string",

                validation:
                  (
                    Rule
                  ) =>
                    Rule.required(),
              }),

              defineField({
                name:
                  "description",

                title:
                  "Description",

                type:
                  "text",

                rows:
                  3,

                validation:
                  (
                    Rule
                  ) =>
                    Rule.required(),
              }),

              defineField({
                name:
                  "symbol",

                title:
                  "Symbol",

                type:
                  "string",

                validation:
                  (
                    Rule
                  ) =>
                    Rule.required(),
              }),

              defineField({
                name:
                  "url",

                title:
                  "External URL",

                type:
                  "url",

                validation:
                  (
                    Rule
                  ) =>
                    Rule.uri({
                      scheme: [
                        "http",
                        "https",
                      ],
                    }),
              }),

              defineField({
                name:
                  "file",

                title:
                  "Uploaded File",

                type:
                  "file",

                options: {
                  storeOriginalFilename:
                    true,

                  accept:
                    ".pdf,.png,.jpg,.jpeg,.webp",
                },

                description:
                  "Upload the material directly instead of using an external URL.",
              }),
            ],

            preview: {
              select: {
                title:
                  "title",

                subtitle:
                  "description",
              },
            },
          }),
        ],
      }),

      defineField({
        name:
          "exam",

        title:
          "Exam & Assessment",

        type:
          "object",

        hidden:
          ({
            parent,
          }) =>
            parent
              ?.resourceType !==
            "Course",

        fields: [
          defineField({
            name:
              "format",

            title:
              "Assessment Format",

            type:
              "text",

            rows:
              4,
          }),

          defineField({
            name:
              "experience",

            title:
              "Student Experience",

            type:
              "text",

            rows:
              4,
          }),
        ],
      }),

      defineField({
        name:
          "links",

        title:
          "Useful Links",

        type:
          "array",

        hidden:
          ({
            parent,
          }) =>
            parent
              ?.resourceType !==
            "Course",

        of: [
          defineArrayMember({
            type:
              "object",

            fields: [
              defineField({
                name:
                  "title",

                title:
                  "Title",

                type:
                  "string",

                validation:
                  (
                    Rule
                  ) =>
                    Rule.required(),
              }),

              defineField({
                name:
                  "description",

                title:
                  "Description",

                type:
                  "text",

                rows:
                  3,
              }),

              defineField({
                name:
                  "url",

                title:
                  "URL",

                type:
                  "url",

                validation:
                  (
                    Rule
                  ) =>
                    Rule
                      .required()
                      .uri({
                        scheme: [
                          "http",
                          "https",
                        ],
                      }),
              }),
            ],

            preview: {
              select: {
                title:
                  "title",

                subtitle:
                  "description",
              },
            },
          }),
        ],
      }),
    ],

    preview: {
      select: {
        title:
          "title",

        type:
          "resourceType",

        course:
          "course",

        symbol:
          "symbol",

        tipType:
          "tipType",
      },

      prepare({
        title,
        type,
        course,
        symbol,
        tipType,
      }) {
        return {
          title:
            `${symbol ?? "📚"} ${title}`,

          subtitle:
            type ===
            "Course"
              ? "Course"
              : [
                  type,
                  course,
                  tipType,
                ]
                  .filter(
                    Boolean
                  )
                  .join(
                    " · "
                  ),
        };
      },
    },
  });