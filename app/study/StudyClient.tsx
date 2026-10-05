"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  filters,
  matchesFilter,
  survivalItems,
  type Filter,
  type Resource,
} from "@/data/study";

type StudyClientProps = {
  resources: Resource[];
};

function ResourceArrow({
  resource,
}: {
  resource: Resource;
}) {
  /*
    FILE ATTACHMENT

    Materials / tests with a Sanity
    file open directly.
  */

  if (
    resource.fileUrl
  ) {
    return (
      <a
        href={
          resource.fileUrl
        }
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${resource.title} in a new tab`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#5790FF] transition hover:bg-[#0057FF] hover:text-white"
      >
        ↗
      </a>
    );
  }

  /*
    EXTERNAL LINK
  */

  if (
    resource.externalUrl
  ) {
    return (
      <a
        href={
          resource.externalUrl
        }
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${resource.title} in a new tab`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#5790FF] transition hover:bg-[#0057FF] hover:text-white"
      >
        ↗
      </a>
    );
  }

  /*
    INTERNAL DETAIL PAGE
  */

  if (
    resource.slug
  ) {
    return (
      <Link
        href={`/study/${resource.slug}`}
        aria-label={`Open ${resource.title}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#5790FF] transition hover:bg-[#0057FF] hover:text-white"
      >
        →
      </Link>
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#53687D]">
      →
    </span>
  );
}

function getResourceSourceLabel(
  resource: Resource
) {
  if (
    resource.author
  ) {
    return resource.author;
  }

  if (
    resource.fileUrl
  ) {
    return "Study material";
  }

  if (
    resource.externalUrl
  ) {
    return "External resource";
  }

  return "BBA Club resource";
}

function getSourceHeading(
  resource: Resource
) {
  if (
    resource.author
  ) {
    return "Shared by";
  }

  if (
    resource.fileUrl ||
    resource.externalUrl
  ) {
    return "Source";
  }

  return "";
}

export default function StudyClient({
  resources,
}: StudyClientProps) {
  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<Filter>(
      "All"
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const filteredResources =
    useMemo(() => {
      const query =
        search
          .toLowerCase()
          .trim();

      return resources.filter(
        (
          resource
        ) => {
          const filterMatch =
            matchesFilter(
              resource,
              activeFilter
            );

          const searchMatch =
            query === "" ||
            resource.title
              .toLowerCase()
              .includes(
                query
              ) ||
            resource.description
              .toLowerCase()
              .includes(
                query
              ) ||
            resource.course
              ?.toLowerCase()
              .includes(
                query
              ) ||
            resource.tag
              .toLowerCase()
              .includes(
                query
              );

          return (
            filterMatch &&
            searchMatch
          );
        }
      );
    }, [
      activeFilter,
      search,
      resources,
    ]);

  /*
    Courses are generated
    automatically from Sanity.
  */

  const courseResources =
    resources.filter(
      (
        resource
      ) =>
        resource.type ===
          "Course" &&
        resource.slug
    );

  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      {/* HERO */}

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-14 md:py-20 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,87,255,0.17),transparent_35%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end lg:gap-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
              BBA Club · Study Hub
            </p>

            <h1 className="mt-4 max-w-4xl text-[42px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl md:mt-5 md:text-7xl">
              Study smarter.
              <br />

              <span className="text-[#0057FF]">
                Share what you know.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-[#A9B5C3] md:mt-7 md:text-lg md:leading-8">
              Course tips, useful
              links, student notes,
              exam previews and
              practical advice — all
              in one place.
            </p>

            {/* MOBILE SUBMIT CTA */}

            <Link
              href="/study/submit"
              className="mt-7 inline-flex items-center rounded-xl bg-[#0057FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2874FF] lg:hidden"
            >
              Submit a resource →
            </Link>
          </div>

          {/* DESKTOP SUBMIT CTA */}

          <div className="hidden rounded-[26px] border border-[#0057FF]/30 bg-[#0D2035] p-7 lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8EC5FF]">
              Student community
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Share your own
              resources.
            </h2>

            <p className="mt-3 leading-7 text-[#A9B5C3]">
              Share notes, study
              tips, test previews or
              useful links with other
              BBA students. Every
              submission is reviewed
              before it appears
              publicly.
            </p>

            <Link
              href="/study/submit"
              className="mt-6 inline-flex items-center rounded-xl bg-[#0057FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2874FF]"
            >
              Submit a resource →
            </Link>
          </div>
        </div>
      </section>

      {/* RESOURCE EXPLORER */}

      <section className="px-6 py-12 md:py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 md:mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
              Resources
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-4xl">
              Find what you need.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#A9B5C3] md:text-base">
              Browse courses,
              materials, student
              advice, test previews
              and useful links.
            </p>
          </div>

          {/* SEARCH */}

          <div className="mb-5 md:mb-6">
            <input
              type="text"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search courses, tips, materials..."
              aria-label="Search Study Hub"
              className="w-full rounded-2xl border border-white/10 bg-[#0B1A29] px-5 py-3.5 text-sm text-white outline-none transition placeholder:text-[#53687D] focus:border-[#0057FF]/70 md:max-w-2xl md:py-4 md:text-base"
            />
          </div>

          {/* FILTERS */}

          <div className="mb-7 flex flex-wrap gap-2 md:mb-10 md:gap-3">
            {filters.map(
              (
                filter
              ) => (
                <button
                  key={
                    filter
                  }
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      filter
                    )
                  }
                  className={`rounded-full px-4 py-2 text-xs font-medium transition md:px-5 md:py-2.5 md:text-sm ${
                    activeFilter ===
                    filter
                      ? "bg-[#0057FF] text-white"
                      : "border border-white/10 bg-white/5 text-[#A9B5C3] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {
                    filter
                  }
                </button>
              )
            )}
          </div>

          <div className="mb-5 flex items-center justify-between md:mb-6">
            <p className="text-xs text-[#71869A] md:text-sm">
              {
                filteredResources
                  .length
              }{" "}
              {filteredResources
                .length ===
              1
                ? "resource"
                : "resources"}
            </p>

            {(search ||
              activeFilter !==
                "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearch(
                    ""
                  );

                  setActiveFilter(
                    "All"
                  );
                }}
                className="text-xs font-medium text-[#5790FF] transition hover:text-white"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredResources.length >
          0 ? (
            <>
              {/* MOBILE */}

              <div className="space-y-3 md:hidden">
                {filteredResources.map(
                  (
                    resource
                  ) => (
                    <article
                      key={
                        resource.slug ??
                        resource.title
                      }
                      className="rounded-[20px] border border-white/10 bg-[#0B1A29] p-4"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
                          {
                            resource.symbol
                          }
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#8EC5FF]">
                              {
                                resource.tag
                              }
                            </span>

                            {resource.course && (
                              <span className="text-[9px] text-[#53687D]">
                                {
                                  resource.course
                                }
                              </span>
                            )}

                            {(resource.fileUrl ||
                              resource.externalUrl) && (
                              <span className="text-[9px] text-[#53687D]">
                                Opens in
                                new tab
                              </span>
                            )}
                          </div>

                          <h2 className="mt-1 text-base font-semibold">
                            {
                              resource.title
                            }
                          </h2>

                          <p className="mt-1.5 text-sm leading-5 text-[#8EA0B3]">
                            {
                              resource.description
                            }
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                            <p className="truncate text-xs text-[#71869A]">
                              {getResourceSourceLabel(
                                resource
                              )}
                            </p>

                            <ResourceArrow
                              resource={
                                resource
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>

              {/* DESKTOP */}

              <div className="hidden gap-5 md:grid md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.map(
                  (
                    resource
                  ) => {
                    const heading =
                      getSourceHeading(
                        resource
                      );

                    return (
                      <article
                        key={
                          resource.slug ??
                          resource.title
                        }
                        className="group flex min-h-[280px] flex-col rounded-[24px] border border-white/10 bg-[#0B1A29] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#0057FF]/50 hover:bg-[#0E2032]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-2xl transition group-hover:bg-[#0057FF]">
                            {
                              resource.symbol
                            }
                          </div>

                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8EC5FF]">
                            {
                              resource.tag
                            }
                          </span>
                        </div>

                        <div className="mt-7">
                          {resource.course && (
                            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#71869A]">
                              {
                                resource.course
                              }
                            </p>
                          )}

                          <h2 className="text-xl font-semibold">
                            {
                              resource.title
                            }
                          </h2>

                          <p className="mt-3 leading-6 text-[#8EA0B3]">
                            {
                              resource.description
                            }
                          </p>
                        </div>

                        <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                          <div className="min-w-0">
                            {heading && (
                              <p className="text-[10px] uppercase tracking-[0.15em] text-[#53687D]">
                                {
                                  heading
                                }
                              </p>
                            )}

                            <p
                              className={`truncate text-sm ${
                                heading
                                  ? "mt-1 text-[#A9B5C3]"
                                  : "text-[#71869A]"
                              }`}
                            >
                              {getResourceSourceLabel(
                                resource
                              )}
                            </p>
                          </div>

                          <ResourceArrow
                            resource={
                              resource
                            }
                          />
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </>
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/15 bg-white/[0.02] p-8 text-center md:rounded-[28px] md:p-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl">
                ⌕
              </div>

              <p className="mt-5 font-semibold md:text-lg">
                Nothing found.
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#71869A]">
                {resources.length ===
                0
                  ? "There are no published Study Hub resources yet."
                  : "Try another search term or category."}
              </p>

              {(search ||
                activeFilter !==
                  "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch(
                      ""
                    );

                    setActiveFilter(
                      "All"
                    );
                  }}
                  className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#A9B5C3] transition hover:bg-white/10 hover:text-white"
                >
                  Show all
                  resources
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* COURSES */}

      <section className="border-t border-white/10 bg-[#091725] px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
            Courses
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] md:text-5xl">
                Find your
                subject.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#A9B5C3] md:text-base">
                Course pages bring
                together tips,
                materials, test
                previews and useful
                links in one place.
              </p>
            </div>

            {courseResources.length >
              0 && (
              <span className="text-sm text-[#53687D]">
                More courses will
                be added over time.
              </span>
            )}
          </div>

          {courseResources.length >
          0 ? (
            <>
              {/* MOBILE */}

              <div className="mt-7 space-y-3 md:hidden">
                {courseResources.map(
                  (
                    course,
                    index
                  ) => (
                    <Link
                      key={
                        course.slug
                      }
                      href={`/study/${course.slug}`}
                      className="flex items-center justify-between rounded-[18px] border border-white/10 bg-[#0D1D2C] p-4 transition hover:border-[#0057FF]/50"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-[#5790FF]">
                          {String(
                            index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <div>
                          <h3 className="font-semibold">
                            {
                              course.title
                            }
                          </h3>

                          <p className="mt-1 text-xs text-[#71869A]">
                            Tips ·
                            Materials ·
                            Tests
                          </p>
                        </div>
                      </div>

                      <span className="text-[#5790FF]">
                        →
                      </span>
                    </Link>
                  )
                )}
              </div>

              {/* DESKTOP */}

              <div className="mt-10 hidden gap-5 md:grid md:grid-cols-2 lg:grid-cols-4">
                {courseResources.map(
                  (
                    course,
                    index
                  ) => (
                    <Link
                      key={
                        course.slug
                      }
                      href={`/study/${course.slug}`}
                      className="group rounded-[22px] border border-white/10 bg-[#0D1D2C] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#0057FF]/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#5790FF]">
                          {String(
                            index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <span className="text-[#5790FF] transition group-hover:translate-x-1">
                          →
                        </span>
                      </div>

                      <div className="mt-9 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl">
                        {
                          course.symbol
                        }
                      </div>

                      <h3 className="mt-5 text-xl font-semibold">
                        {
                          course.title
                        }
                      </h3>

                      <p className="mt-2 text-sm text-[#71869A]">
                        Tips ·
                        Materials ·
                        Tests
                      </p>
                    </Link>
                  )
                )}
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-[22px] border border-dashed border-white/15 bg-white/[0.02] p-8 text-center md:p-12">
              <p className="font-semibold md:text-lg">
                No course pages
                yet.
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#71869A]">
                Course resources
                will appear here as
                the Study Hub grows.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* UNIVERSITY SURVIVAL */}

      <section className="border-t border-white/10 px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
                University
                survival
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-4xl">
                Things nobody
                tells you at the
                start.
              </h2>

              <p className="mt-4 leading-7 text-[#A9B5C3] md:mt-5">
                Practical
                information for
                navigating
                university life
                without having to
                discover everything
                the hard way.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
              {survivalItems.map(
                (
                  item
                ) => (
                  <article
                    key={
                      item.title
                    }
                    className="rounded-[18px] border border-white/10 bg-[#0B1A29] p-5 md:rounded-[22px] md:p-6"
                  >
                    <span className="text-xs font-semibold text-[#5790FF] md:text-sm">
                      {
                        item.number
                      }
                    </span>

                    <h3 className="mt-4 text-lg font-semibold md:mt-7 md:text-xl">
                      {
                        item.title
                      }
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#8EA0B3] md:mt-3 md:text-base">
                      {
                        item.text
                      }
                    </p>
                  </article>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}

      <section className="border-t border-white/10 bg-[#091725] px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[24px] border border-[#0057FF]/30 bg-[linear-gradient(120deg,#0D2035,#091725)] p-6 md:rounded-[30px] md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8EC5FF] md:text-xs">
                  Student community
                </p>

                <h2 className="mt-3 text-2xl font-bold md:mt-4 md:text-4xl">
                  Help build the
                  Study Hub.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#A9B5C3] md:mt-5 md:text-base md:leading-7">
                  Have notes,
                  advice, a useful
                  link or an old test
                  preview that could
                  help somebody
                  else? Send it to
                  us. Every
                  submission is
                  reviewed before it
                  becomes public.
                </p>

                <Link
                  href="/study/submit"
                  className="mt-6 inline-flex items-center rounded-xl bg-[#0057FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2874FF]"
                >
                  Submit a resource
                  →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {[
                  {
                    symbol:
                      "📄",

                    title:
                      "Upload notes",
                  },

                  {
                    symbol:
                      "💡",

                    title:
                      "Share a tip",
                  },

                  {
                    symbol:
                      "📝",

                    title:
                      "Add test preview",
                  },

                  {
                    symbol:
                      "🔗",

                    title:
                      "Recommend a link",
                  },
                ].map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.title
                      }
                      className="rounded-xl border border-white/10 bg-[#071422]/60 p-4 md:rounded-2xl md:p-5"
                    >
                      <span className="text-lg">
                        {
                          item.symbol
                        }
                      </span>

                      <p className="mt-3 text-xs font-medium text-[#A9B5C3] md:text-sm">
                        {
                          item.title
                        }
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}