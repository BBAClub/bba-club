"use client";

import {
  defineConfig,
} from "sanity";

import {
  structureTool,
} from "sanity/structure";

import {
  dataset,
  projectId,
} from "./sanity/env";

import {
  schemaTypes,
} from "./sanity/schemaTypes";

import {
  structure,
} from "./sanity/structure";

import {
  reviewSubmissionAction,
} from "./sanity/actions/reviewSubmission";

import {
  manageEventRegistrationAction,
} from "./sanity/actions/manageEventRegistration";

export default defineConfig({
  name: "default",

  title: "BBA Club",

  basePath: "/studio",

  projectId,

  dataset,

  plugins: [
    structureTool({
      structure,
    }),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (
      prev,
      context
    ) => {
      /*
        STUDENT SUBMISSIONS
      */

      if (
        context.schemaType ===
        "submission"
      ) {
        return [
          reviewSubmissionAction,
          ...prev,
        ];
      }

      /*
        EVENT REGISTRATIONS
      */

      if (
        context.schemaType ===
        "eventRegistration"
      ) {
        return [
          manageEventRegistrationAction,
          ...prev,
        ];
      }

      return prev;
    },
  },
});