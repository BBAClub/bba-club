import { client } from "@/sanity/lib/client";

import StudentTipsFilter, {
  type StudentTip,
  type TipCategory,
} from "./StudentTipsFilter";

type CuratedTip = {
  title: string;
  text: string;
};

type SanityCommunityTip = {
  _id: string;

  title: string;

  slug?: string;

  description: string;

  tipType?: TipCategory;

  author?: string;

  _createdAt: string;
};

type StudentTipsSectionProps = {
  courseTitle: string;

  curatedTips: CuratedTip[];
};

const COMMUNITY_TIPS_QUERY = `
  *[
    _type == "studyResource"
    && resourceType == "Tip"
    && course == $courseTitle
  ]
  | order(_createdAt desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    tipType,
    author,
    _createdAt
  }
`;

export default async function StudentTipsSection({
  courseTitle,
  curatedTips,
}: StudentTipsSectionProps) {
  const communityTips =
    await client.fetch<
      SanityCommunityTip[]
    >(
      COMMUNITY_TIPS_QUERY,
      {
        courseTitle,
      }
    );

  /*
    Tips entered directly inside
    the Course resource are treated
    as General Advice.
  */

  const curated: StudentTip[] =
    curatedTips.map(
      (tip, index) => ({
        id: `curated-${index}`,

        title: tip.title,

        description:
          tip.text,

        tipType: "general",

        author: "BBA Club",

        source: "curated",
      })
    );

  /*
    Student-submitted tips.
    Older tips without a tipType
    automatically fall under General.
  */

  const community: StudentTip[] =
    communityTips.map(
      (tip) => ({
        id: tip._id,

        title: tip.title,

        description:
          tip.description,

        tipType:
          tip.tipType ??
          "general",

        author:
          tip.author ??
          "BBA student",

        slug: tip.slug,

        source: "community",
      })
    );

  const tips = [
    ...community,
    ...curated,
  ];

  return (
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

            <p className="mt-3 max-w-xl leading-7 text-[#A9B5C3]">
              Practical advice from
              students who have already
              taken {courseTitle}.
            </p>
          </div>

          <span className="text-sm text-[#53687D]">
            {tips.length}{" "}
            {tips.length === 1
              ? "tip"
              : "tips"}
          </span>
        </div>

        <StudentTipsFilter
          tips={tips}
        />
      </div>
    </section>
  );
}