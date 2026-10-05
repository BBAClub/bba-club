import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  client,
} from "@/sanity/lib/client";

import {
  STUDY_RESOURCE_BY_SLUG_QUERY,
} from "@/sanity/lib/queries";

import type {
  Resource,
  ResourceType,
} from "@/data/study";

export const dynamic =
  "force-dynamic";

type RelatedResource = {
  _id: string;

  title: string;

  resourceType:
    | "Tip"
    | "Material"
    | "Test";

  description: string;

  course?: string;

  tipType?: string;

  tag: string;

  symbol: string;

  author?: string;

  externalUrl?: string;

  fileUrl?: string;
};

type SanityStudyResource = {
  _id: string;

  title: string;

  slug?: string;

  resourceType:
    ResourceType;

  description: string;

  course?: string;

  tag: string;

  symbol: string;

  author?: string;

  externalUrl?: string;

  fileUrl?: string;

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

  relatedResources?: RelatedResource[];
};

type StudyDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
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

export default async function StudyDetailPage({
  params,
}: StudyDetailPageProps) {
  const {
    slug,
  } =
    await params;

  const sanityResource =
    await client.fetch<
      SanityStudyResource | null
    >(
      STUDY_RESOURCE_BY_SLUG_QUERY,
      {
        slug,
      }
    );

  if (
    !sanityResource
  ) {
    notFound();
  }

  const resource =
    convertStudyResource(
      sanityResource
    );

  if (!resource) {
    notFound();
  }

  const isCourse =
    resource.type ===
    "Course";

  const details =
    resource.details;

  const relatedResources =
    sanityResource
      .relatedResources ??
    [];

  const relatedTips =
    relatedResources.filter(
      (
        item
      ) =>
        item.resourceType ===
        "Tip"
    );

  const relatedMaterials =
    relatedResources.filter(
      (
        item
      ) =>
        item.resourceType ===
          "Material" ||
        item.resourceType ===
          "Test"
    );

  const allTips =
    isCourse &&
    details
      ? [
          ...details.tips.map(
            (
              tip
            ) => ({
              title:
                tip.title,

              text:
                tip.text,

              author:
                undefined as
                  | string
                  | undefined,

              community:
                false,
            })
          ),

          ...relatedTips.map(
            (
              tip
            ) => ({
              title:
                tip.title,

              text:
                tip.description,

              author:
                tip.author,

              community:
                true,
            })
          ),
        ]
      : [];

  const allMaterials =
    isCourse &&
    details
      ? [
          ...details.materials.map(
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
                material.fileUrl ??
                material.url,

              type:
                "Material" as const,

              author:
                undefined as
                  | string
                  | undefined,

              community:
                false,
            })
          ),

          ...relatedMaterials.map(
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
                material.fileUrl ??
                material.externalUrl,

              type:
                material.resourceType,

              author:
                material.author,

              community:
                true,
            })
          ),
        ]
      : [];

  const resourceUrl =
    resource.fileUrl ??
    resource.externalUrl;

  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 py-14 md:py-20 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,87,255,0.17),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/study"
            className="text-sm text-[#8EA0B3] transition hover:text-white"
          >
            ← Back to Study Hub
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-end lg:gap-12">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#0057FF]/30 bg-[#0057FF]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8EC5FF]">
                  {
                    resource.tag
                  }
                </span>

                {resource.course && (
                  <span className="text-sm text-[#71869A]">
                    {
                      resource.course
                    }
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-start gap-4 md:gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0057FF] text-2xl md:h-16 md:w-16 md:text-3xl">
                  {
                    resource.symbol
                  }
                </div>

                <h1 className="max-w-4xl text-[38px] font-bold leading-[1] tracking-[-0.045em] sm:text-5xl md:text-6xl">
                  {
                    resource.title
                  }
                </h1>
              </div>

              <p className="mt-6 max-w-2xl text-base leading-7 text-[#A9B5C3] md:text-lg md:leading-8">
                {
                  resource.description
                }
              </p>
            </div>

            {/* META */}
            <div className="rounded-[22px] border border-white/10 bg-[#0D1D2C] p-5 md:rounded-[26px] md:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF] md:text-xs">
                Resource info
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-sm text-[#71869A]">
                    Type
                  </span>

                  <span className="text-sm font-semibold">
                    {
                      resource.type
                    }
                  </span>
                </div>

                {resource.course && (
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-sm text-[#71869A]">
                      Course
                    </span>

                    <span className="text-sm font-semibold">
                      {
                        resource.course
                      }
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#71869A]">
                    Shared by
                  </span>

                  <span className="text-right text-sm font-semibold">
                    {resource.author ??
                      "BBA Club"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isCourse &&
      details ? (
        <>
          {/* STICKY COURSE NAVIGATION */}
          <section className="sticky top-[74px] z-40 border-y border-white/10 bg-[#091725]/95 px-6 shadow-lg shadow-black/10 backdrop-blur-xl lg:px-10">
            <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto py-4 text-sm">
              <a
                href="#overview"
                className="shrink-0 font-medium text-[#A9B5C3] transition hover:text-white"
              >
                Overview
              </a>

              <a
                href="#tips"
                className="shrink-0 font-medium text-[#A9B5C3] transition hover:text-white"
              >
                Student Tips
              </a>

              <a
                href="#materials"
                className="shrink-0 font-medium text-[#A9B5C3] transition hover:text-white"
              >
                Materials
              </a>

              <a
                href="#exam"
                className="shrink-0 font-medium text-[#A9B5C3] transition hover:text-white"
              >
                Exam & Assessment
              </a>

              <a
                href="#links"
                className="shrink-0 font-medium text-[#A9B5C3] transition hover:text-white"
              >
                Useful Links
              </a>
            </div>
          </section>

          {/* OVERVIEW */}
          <section
            id="overview"
            className="scroll-mt-32 px-6 py-14 md:py-20 lg:px-10"
          >
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF]">
                  Overview
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-4xl">
                  Start here.
                </h2>

                <p className="mt-4 leading-7 text-[#A9B5C3]">
                  The most useful
                  information about{" "}
                  {
                    resource.title
                  }{" "}
                  in one place.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#0B1A29] p-6 md:p-8">
                <p className="leading-7 text-[#A9B5C3] md:text-lg md:leading-8">
                  {details.overview ??
                    "Course information will be added here."}
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#71869A]">
                      Tips
                    </p>

                    <p className="mt-2 font-semibold">
                      {
                        allTips.length
                      }{" "}
                      sections
                    </p>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#71869A]">
                      Materials
                    </p>

                    <p className="mt-2 font-semibold">
                      {
                        allMaterials.length
                      }{" "}
                      resources
                    </p>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#71869A]">
                      Links
                    </p>

                    <p className="mt-2 font-semibold">
                      {
                        details
                          .links
                          .length
                      }{" "}
                      useful links
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STUDENT TIPS */}
          <section
            id="tips"
            className="scroll-mt-32 border-t border-white/10 bg-[#091725] px-6 py-14 md:py-20 lg:px-10"
          >
            <div className="mx-auto max-w-7xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF]">
                Student Tips
              </p>

              <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <h2 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">
                    What students recommend.
                  </h2>

                  <p className="mt-3 max-w-xl text-[#A9B5C3]">
                    Practical advice from
                    students who have
                    already taken the
                    course.
                  </p>
                </div>

                <span className="text-sm text-[#53687D]">
                  Community content
                </span>
              </div>

              {allTips.length >
              0 ? (
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {allTips.map(
                    (
                      tip,
                      index
                    ) => (
                      <article
                        key={`${tip.title}-${index}`}
                        className="rounded-[20px] border border-white/10 bg-[#0D1D2C] p-5 md:p-6"
                      >
                        <span className="text-sm font-semibold text-[#5790FF]">
                          {String(
                            index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <h3 className="mt-5 text-lg font-semibold">
                          {
                            tip.title
                          }
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-[#8EA0B3]">
                          {
                            tip.text
                          }
                        </p>

                        {tip.community && (
                          <div className="mt-5 border-t border-white/10 pt-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#53687D]">
                              Community
                              submission
                            </p>

                            {tip.author && (
                              <p className="mt-1 text-xs text-[#71869A]">
                                Shared
                                by{" "}
                                {
                                  tip.author
                                }
                              </p>
                            )}
                          </div>
                        )}
                      </article>
                    )
                  )}
                </div>
              ) : (
                <div className="mt-8 rounded-[20px] border border-dashed border-white/15 p-7 text-center">
                  <p className="text-sm text-[#71869A]">
                    Student tips will
                    be added here.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* MATERIALS */}
          <section
            id="materials"
            className="scroll-mt-32 border-t border-white/10 px-6 py-14 md:py-20 lg:px-10"
          >
            <div className="mx-auto max-w-7xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF]">
                Materials
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-4xl">
                Everything worth keeping.
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-[#A9B5C3]">
                Notes, summaries and
                approved study resources.
              </p>

              {allMaterials.length >
              0 ? (
                <div className="mt-8 space-y-3">
                  {allMaterials.map(
                    (
                      material,
                      index
                    ) => {
                      const content =
                        (
                          <>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
                              {
                                material.symbol
                              }
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold">
                                {
                                  material.title
                                }
                              </h3>

                              <p className="mt-1 text-sm text-[#71869A]">
                                {
                                  material.description
                                }
                              </p>

                              {material.community && (
                                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#53687D]">
                                  {material.type ===
                                  "Test"
                                    ? "Student test preview"
                                    : "Student material"}

                                  {material.author
                                    ? ` · ${material.author}`
                                    : ""}
                                </p>
                              )}
                            </div>

                            <span className="shrink-0 text-[#5790FF]">
                              {material.url
                                ? "→"
                                : "Soon"}
                            </span>
                          </>
                        );

                      if (
                        material.url
                      ) {
                        return (
                          <a
                            key={`${material.title}-${index}`}
                            href={
                              material.url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-4 rounded-[18px] border border-white/10 bg-[#0B1A29] p-4 transition hover:border-[#0057FF]/50 md:p-5"
                          >
                            {
                              content
                            }
                          </a>
                        );
                      }

                      return (
                        <div
                          key={`${material.title}-${index}`}
                          className="flex items-center gap-4 rounded-[18px] border border-white/10 bg-[#0B1A29] p-4 md:p-5"
                        >
                          {
                            content
                          }
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="mt-8 rounded-[20px] border border-dashed border-white/15 p-7 text-center">
                  <p className="text-sm text-[#71869A]">
                    Course materials will
                    appear here.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* EXAM */}
          <section
            id="exam"
            className="scroll-mt-32 border-t border-white/10 bg-[#091725] px-6 py-14 md:py-20 lg:px-10"
          >
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF]">
                  Exam & Assessment
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-4xl">
                  Know what to expect.
                </h2>

                <p className="mt-4 leading-7 text-[#A9B5C3]">
                  Assessment information
                  can change between
                  semesters, so official
                  course information should
                  always remain the primary
                  source.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[20px] border border-white/10 bg-[#0D1D2C] p-5 md:p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5790FF]">
                    Format
                  </p>

                  <h3 className="mt-3 text-lg font-semibold">
                    Assessment structure
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#71869A]">
                    {details.exam
                      ?.format ??
                      "Assessment information has not been added yet."}
                  </p>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-[#0D1D2C] p-5 md:p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5790FF]">
                    Community
                  </p>

                  <h3 className="mt-3 text-lg font-semibold">
                    Past experience
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#71869A]">
                    {details.exam
                      ?.experience ??
                      "Student experiences will be added here."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* USEFUL LINKS */}
          <section
            id="links"
            className="scroll-mt-32 border-t border-white/10 px-6 py-14 md:py-20 lg:px-10"
          >
            <div className="mx-auto max-w-7xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF]">
                Useful Links
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-4xl">
                Official sources first.
              </h2>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {details.links.map(
                  (
                    link,
                    index
                  ) => (
                    <a
                      key={`${link.title}-${index}`}
                      href={
                        link.url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between rounded-[20px] border border-white/10 bg-[#0B1A29] p-5 transition hover:border-[#0057FF]/50"
                    >
                      <div>
                        <h3 className="font-semibold">
                          {
                            link.title
                          }
                        </h3>

                        {link.description && (
                          <p className="mt-2 text-sm text-[#71869A]">
                            {
                              link.description
                            }
                          </p>
                        )}
                      </div>

                      <span className="ml-4 shrink-0 text-[#5790FF] transition group-hover:translate-x-1">
                        ↗
                      </span>
                    </a>
                  )
                )}

                <Link
                  href="/study"
                  className="group flex items-center justify-between rounded-[20px] border border-white/10 bg-[#0B1A29] p-5 transition hover:border-[#0057FF]/50"
                >
                  <div>
                    <h3 className="font-semibold">
                      More Study Hub
                      resources
                    </h3>

                    <p className="mt-2 text-sm text-[#71869A]">
                      Browse all courses,
                      tips and materials.
                    </p>
                  </div>

                  <span className="ml-4 shrink-0 text-[#5790FF] transition group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* NON-COURSE RESOURCE */
        <section className="px-6 py-14 md:py-20 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.42fr] lg:gap-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF]">
                Study resource
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-4xl">
                About this resource.
              </h2>

              <div className="mt-7 rounded-[22px] border border-white/10 bg-[#0B1A29] p-6 md:rounded-[26px] md:p-8">
                <p className="leading-7 text-[#A9B5C3] md:text-lg md:leading-8">
                  {
                    resource.description
                  }
                </p>

                {resourceUrl ? (
                  <a
                    href={
                      resourceUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-8 inline-flex items-center rounded-xl bg-[#0057FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2874FF]"
                  >
                    {resource.type ===
                    "Test"
                      ? "Open test preview ↗"
                      : resource.type ===
                          "Material"
                        ? "Open material ↗"
                        : "Open resource ↗"}
                  </a>
                ) : (
                  <div className="mt-8 border-t border-white/10 pt-7">
                    <p className="font-semibold">
                      No attachment added.
                    </p>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71869A]">
                      This resource does
                      not currently have a
                      file or external link.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <aside className="self-start rounded-[24px] border border-[#0057FF]/30 bg-[#0D2035] p-6 lg:sticky lg:top-24">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
                BBA Study Hub
              </p>

              <h2 className="mt-3 text-xl font-semibold">
                More resources.
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#A9B5C3]">
                Browse courses, tips,
                materials and useful links
                from the rest of Study Hub.
              </p>

              <Link
                href="/study"
                className="mt-6 block rounded-xl bg-[#0057FF] px-5 py-3 text-center text-sm font-semibold transition hover:bg-[#2874FF]"
              >
                Explore Study Hub
              </Link>
            </aside>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}