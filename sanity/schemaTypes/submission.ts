import {
  defineField,
  defineType,
} from "sanity";

const tipTypes = [
  {
    title: "General advice",
    value: "general",
  },
  {
    title: "Lectures & seminars",
    value: "lectures",
  },
  {
    title: "Assignments & projects",
    value: "assignments",
  },
  {
    title: "Exam / test",
    value: "exam",
  },
  {
    title: "Study strategy",
    value: "strategy",
  },
  {
    title: "Resources & materials",
    value: "resources",
  },
];

export const submissionType =
  defineType({
    name: "submission",
    title: "Student Submission",
    type: "document",

    fields: [
      defineField({
        name: "status",
        title: "Status",
        type: "string",

        options: {
          list: [
            {
              title: "Pending",
              value: "pending",
            },
            {
              title: "Approved",
              value: "approved",
            },
            {
              title: "Rejected",
              value: "rejected",
            },
          ],

          layout: "radio",
        },

        initialValue:
          "pending",

        validation: (Rule) =>
          Rule.required(),
      }),

      defineField({
        name: "submittedAt",
        title: "Submitted At",
        type: "datetime",

        initialValue: () =>
          new Date()
            .toISOString(),
      }),

      defineField({
        name: "name",
        title: "Student Name",
        type: "string",

        validation: (Rule) =>
          Rule.required(),
      }),

      defineField({
        name: "email",
        title: "Email",
        type: "string",

        validation: (Rule) =>
          Rule
            .required()
            .email(),
      }),

      defineField({
        name: "submissionType",
        title: "Submission Type",
        type: "string",

        options: {
          list: [
            {
              title:
                "Study Tip",
              value:
                "tip",
            },
            {
              title:
                "Study Material",
              value:
                "material",
            },
            {
              title:
                "Test / Exam Preview",
              value:
                "test",
            },
            {
              title:
                "Useful Link",
              value:
                "link",
            },
          ],

          layout:
            "dropdown",
        },

        validation: (Rule) =>
          Rule.required(),
      }),

      defineField({
        name: "course",
        title: "Course",
        type: "string",

        description:
          "Course selected by the student.",
      }),

      defineField({
        name: "tipType",
        title: "Tip Category",
        type: "string",

        hidden: ({
          document,
        }) =>
          document
            ?.submissionType !==
          "tip",

        options: {
          list:
            tipTypes,

          layout:
            "dropdown",
        },

        validation: (Rule) =>
          Rule.custom(
            (
              value,
              context
            ) => {
              if (
                context
                  .document
                  ?.submissionType ===
                  "tip" &&
                !value
              ) {
                return "Choose a tip category.";
              }

              return true;
            }
          ),
      }),

      defineField({
        name: "title",
        title: "Title",
        type: "string",

        validation: (Rule) =>
          Rule.required(),
      }),

      defineField({
        name: "description",
        title: "Description",
        type: "text",
        rows: 6,

        validation: (Rule) =>
          Rule.required(),
      }),

      defineField({
        name: "url",
        title: "External URL",
        type: "url",

        hidden: ({
          document,
        }) =>
          document
            ?.submissionType !==
            "link" &&
          document
            ?.submissionType !==
            "material",

        validation: (Rule) =>
          Rule.uri({
            scheme: [
              "http",
              "https",
            ],
          }),
      }),

      /*
        PRIVATE VERCEL BLOB

        This replaces the old
        public Sanity file asset.
      */

      defineField({
        name: "privateFile",
        title:
          "Private Attachment",

        type:
          "object",

        description:
          "Pending attachment stored privately in Vercel Blob. It is not publicly accessible.",

        hidden: ({
          document,
        }) =>
          document
            ?.submissionType !==
            "material" &&
          document
            ?.submissionType !==
            "test",

        fields: [
          defineField({
            name:
              "originalFilename",

            title:
              "Original Filename",

            type:
              "string",

            readOnly:
              true,
          }),

          defineField({
            name:
              "contentType",

            title:
              "Content Type",

            type:
              "string",

            readOnly:
              true,
          }),

          defineField({
            name:
              "size",

            title:
              "File Size (bytes)",

            type:
              "number",

            readOnly:
              true,
          }),

          defineField({
            name:
              "pathname",

            title:
              "Private Blob Path",

            type:
              "string",

            readOnly:
              true,
          }),

          defineField({
            name:
              "url",

            title:
              "Private Blob URL",

            type:
              "url",

            readOnly:
              true,
          }),
        ],
      }),

      defineField({
        name:
          "publishedResourceId",

        title:
          "Published Resource ID",

        type:
          "string",

        readOnly:
          true,

        hidden:
          true,
      }),

      defineField({
        name:
          "publishedAt",

        title:
          "Published At",

        type:
          "datetime",

        readOnly:
          true,

        hidden:
          true,
      }),

      defineField({
        name:
          "reviewNote",

        title:
          "Internal Review Note",

        type:
          "text",

        rows:
          4,

        description:
          "Only for the BBA Club team.",
      }),
    ],

    preview: {
      select: {
        title:
          "title",

        status:
          "status",

        type:
          "submissionType",

        course:
          "course",

        tipType:
          "tipType",

        filename:
          "privateFile.originalFilename",
      },

      prepare({
        title,
        status,
        type,
        course,
        tipType,
        filename,
      }) {
        const statusLabel =
          status ===
          "approved"
            ? "✓ Approved"
            : status ===
                "rejected"
              ? "✕ Rejected"
              : "⏳ Pending";

        return {
          title,

          subtitle: [
            statusLabel,
            type,
            course,
            tipType,
            filename,
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