"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

export type TipCategory =
  | "general"
  | "lectures"
  | "assignments"
  | "exam"
  | "strategy"
  | "resources";

export type StudentTip = {
  id: string;

  title: string;

  description: string;

  tipType: TipCategory;

  author: string;

  slug?: string;

  source:
    | "curated"
    | "community";
};

type Filter =
  | "all"
  | TipCategory;

type StudentTipsFilterProps = {
  tips: StudentTip[];
};

const categories: {
  value: Filter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All tips",
  },

  {
    value: "general",
    label: "General advice",
  },

  {
    value: "lectures",
    label:
      "Lectures & seminars",
  },

  {
    value: "assignments",
    label:
      "Assignments & projects",
  },

  {
    value: "exam",
    label: "Exam / test",
  },

  {
    value: "strategy",
    label: "Study strategy",
  },

  {
    value: "resources",
    label:
      "Resources & materials",
  },
];

const categoryLabels: Record<
  TipCategory,
  string
> = {
  general: "General advice",

  lectures:
    "Lectures & seminars",

  assignments:
    "Assignments & projects",

  exam: "Exam / test",

  strategy:
    "Study strategy",

  resources:
    "Resources & materials",
};

export default function StudentTipsFilter({
  tips,
}: StudentTipsFilterProps) {
  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<Filter>("all");

  const filteredTips =
    useMemo(() => {
      if (
        activeFilter ===
        "all"
      ) {
        return tips;
      }

      return tips.filter(
        (tip) =>
          tip.tipType ===
          activeFilter
      );
    }, [
      tips,
      activeFilter,
    ]);

  /*
    Hide categories that currently
    contain no tips.

    All tips is always visible.
  */

  const visibleCategories =
    categories.filter(
      (category) => {
        if (
          category.value ===
          "all"
        ) {
          return true;
        }

        return tips.some(
          (tip) =>
            tip.tipType ===
            category.value
        );
      }
    );

  function countForCategory(
    category: Filter
  ) {
    if (category === "all") {
      return tips.length;
    }

    return tips.filter(
      (tip) =>
        tip.tipType ===
        category
    ).length;
  }

  return (
    <>
      {tips.length > 0 ? (
        <>
          {/* FILTERS */}
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2 md:flex-wrap">
            {visibleCategories.map(
              (category) => (
                <button
                  key={
                    category.value
                  }
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      category.value
                    )
                  }
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition md:px-5 md:py-2.5 md:text-sm ${
                    activeFilter ===
                    category.value
                      ? "bg-[#0057FF] text-white"
                      : "border border-white/10 bg-white/5 text-[#A9B5C3] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {category.label}

                  <span
                    className={`ml-2 ${
                      activeFilter ===
                      category.value
                        ? "text-white/65"
                        : "text-[#53687D]"
                    }`}
                  >
                    {countForCategory(
                      category.value
                    )}
                  </span>
                </button>
              )
            )}
          </div>

          {/* ACTIVE FILTER INFO */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-[#71869A] md:text-sm">
              {
                filteredTips.length
              }{" "}
              {filteredTips.length ===
              1
                ? "tip"
                : "tips"}
            </p>

            {activeFilter !==
              "all" && (
              <button
                type="button"
                onClick={() =>
                  setActiveFilter(
                    "all"
                  )
                }
                className="text-xs font-medium text-[#5790FF] transition hover:text-[#8EC5FF]"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* TIP CARDS */}
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTips.map(
              (tip, index) => {
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm font-semibold text-[#5790FF]">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8EC5FF]">
                        {
                          categoryLabels[
                            tip.tipType
                          ]
                        }
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      {tip.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[#8EA0B3]">
                      {
                        tip.description
                      }
                    </p>

                    <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#53687D]">
                          Shared by
                        </p>

                        <p className="mt-1 text-sm text-[#A9B5C3]">
                          {tip.author}
                        </p>
                      </div>

                      {tip.source ===
                      "community" ? (
                        <span className="rounded-full bg-[#0057FF]/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#5790FF]">
                          Student
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#71869A]">
                          Curated
                        </span>
                      )}
                    </div>
                  </>
                );

                /*
                  Community tips already
                  have their own slug and
                  can open their detail.

                  Curated course tips don't
                  have a separate page.
                */

                if (tip.slug) {
                  return (
                    <Link
                      key={
                        tip.id
                      }
                      href={`/study/${tip.slug}`}
                      className="group rounded-[20px] border border-white/10 bg-[#0D1D2C] p-5 transition hover:-translate-y-0.5 hover:border-[#0057FF]/50 md:p-6"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <article
                    key={tip.id}
                    className="rounded-[20px] border border-white/10 bg-[#0D1D2C] p-5 md:p-6"
                  >
                    {content}
                  </article>
                );
              }
            )}
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-[20px] border border-dashed border-white/15 p-8 text-center">
          <p className="font-semibold">
            No student tips yet.
          </p>

          <p className="mt-2 text-sm text-[#71869A]">
            Be the first student
            to share something
            useful for this course.
          </p>

          <Link
            href="/study/submit"
            className="mt-5 inline-block rounded-xl bg-[#0057FF] px-5 py-3 text-sm font-semibold transition hover:bg-[#2874FF]"
          >
            Share a tip
          </Link>
        </div>
      )}
    </>
  );
}