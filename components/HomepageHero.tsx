import Image from "next/image";
import Link from "next/link";

type HomepageHeroProps = {
  heroImageUrl?: string;
  heroImageAlt?: string;
};

export default function HomepageHero({ heroImageUrl, heroImageAlt }: HomepageHeroProps) {
  return (
    <section className="border-b border-white/10">
      <div className={`club-shell club-section grid items-center gap-9 ${
        heroImageUrl ? "lg:grid-cols-2 lg:gap-16" : ""
      }`}>
        <div>
          <div aria-hidden="true" className="mb-6 h-1 w-10 bg-[#0057FF]" />
          <h1 className="club-display max-w-[18ch]">
            More than a degree. <span className="text-[#8EC5FF]">A bigger journey.</span>
          </h1>
          <p className="club-intro mt-5 text-[#A9B5C3]">
            BBA Club connects students through events, experiences, useful resources
            and the best of Prague — inside and outside the classroom.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/events" className="inline-flex min-h-11 items-center rounded-lg bg-[#0057FF] px-5 font-semibold text-white hover:bg-[#0048D8]">
              See upcoming events
            </Link>
            <a href="#events" className="inline-flex min-h-11 items-center font-semibold text-[#8EC5FF] underline-offset-4 hover:underline">
              Want to be involved? →
            </a>
          </div>
          <p className="mt-7 border-t border-white/10 pt-4 text-sm leading-6 text-[#A9B5C3]">
            Student-led community · Prague beyond campus · BBA together
          </p>
        </div>

        {heroImageUrl && (
          <figure>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#0D1D2C]">
              <Image src={heroImageUrl} alt={heroImageAlt || "BBA Club community"} fill preload
                sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <figcaption className="mt-3 text-sm text-[#A9B5C3]">
              Your university experience goes beyond university.
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
