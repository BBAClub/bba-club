import StudyClient from "./StudyClient";

import {
  client,
} from "@/sanity/lib/client";

import {
  STUDY_RESOURCES_QUERY,
} from "@/sanity/lib/queries";

import type {
  Resource,
  ResourceType,
} from "@/data/study";

export const dynamic =
  "force-dynamic";

type SanityStudyResource = {
  _id: string;

  title: string;

  slug?: string;

  resourceType:
    ResourceType;

  description:
    string;

  course?: string;

  tag: string;

  symbol: string;

  author?: string;

  externalUrl?: string;

  fileUrl?: string;

  order?: number;

  overview?: string;

  tips?: {
    title: string;
    text: string;
  }[];

  materials?: {
    title: string;
    description: string;
    symbol: string;
    url?: string;
    fileUrl?: string;
  }[];

  exam?: {
    format?: string;
    experience?: string;
  };

  links?: {
    title: string;
    description?: string;
    url: string;
  }[];
};

function convertStudyResource(
  resource:
    SanityStudyResource
): Resource | null {
  if (
    !resource.title ||
    !resource.resourceType ||
    !resource.description ||
    !resource.tag ||
    !resource.symbol
  ) {
    return null;
  }

  return {
    title:
      resource.title,

    slug:
      resource.slug,

    externalUrl:
      resource.externalUrl,

    fileUrl:
      resource.fileUrl,

    course:
      resource.course,

    type:
      resource.resourceType,

    description:
      resource.description,

    tag:
      resource.tag,

    symbol:
      resource.symbol,

    author:
      resource.author,

    order:
      resource.order,

    details:
      resource.resourceType ===
      "Course"
        ? {
            overview:
              resource.overview,

            tips:
              resource.tips ??
              [],

            materials:
              (
                resource.materials ??
                []
              ).map(
                (
                  material
                ) => ({
                  title:
                    material.title,

                  description:
                    material.description,

                  symbol:
                    material.symbol,

                  url:
                    material.url,

                  fileUrl:
                    material.fileUrl,
                })
              ),

            exam:
              resource.exam,

            links:
              resource.links ??
              [],
          }
        : undefined,
  };
}

export default async function StudyPage() {
  const sanityResources =
    await client.fetch<
      SanityStudyResource[]
    >(
      STUDY_RESOURCES_QUERY
    );

  const resources =
    sanityResources
      .map(
        convertStudyResource
      )
      .filter(
        (
          resource
        ): resource is Resource =>
          resource !==
          null
      );

  return (
    <StudyClient
      resources={
        resources
      }
    />
  );
}