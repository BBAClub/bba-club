type HomepageHeroProps = {
  heroImageUrl?: string;
  heroImageAlt?: string;
};

export default function HomepageHero({
  heroImageUrl,
  heroImageAlt,
}: HomepageHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(0,87,255,0.20),transparent_35%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-12 sm:py-14 lg:min-h-[610px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-10 lg:py-16">
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8EC5FF] sm:mb-5 sm:text-xs sm:tracking-[0.28em]">
            Students · Prague · Opportunities
          </p>

          <h1 className="max-w-xl text-[2.85rem] font-bold leading-[1.02] tracking-[-0.045em] sm:text-5xl md:text-7xl">
            More than
            <br />
            a degree.
            <br />

            <span className="text-[#0057FF]">
              A bigger journey.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-[#A9B5C3] sm:mt-7 md:text-lg md:leading-8">
            BBA Club connects students
            through events, experiences,
            useful resources and the best
            of Prague — inside and outside
            the classroom.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-4">
            <a
              href="#events"
              className="w-full rounded-xl bg-[#0057FF] px-6 py-3.5 text-center font-semibold transition hover:bg-[#2874FF] sm:w-auto sm:px-7 sm:py-4"
            >
              Want to be involved? →
            </a>

            <a
              href="/events"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-center font-semibold transition hover:bg-white/10 sm:w-auto sm:px-7 sm:py-4"
            >
              See upcoming events
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 sm:mt-12">
            <div>
              <div className="text-[17px] font-bold sm:text-2xl">
                Student-led
              </div>

              <div className="mt-1 text-xs text-[#7F8C9B] sm:text-sm">
                community
              </div>
            </div>

            <div className="border-l border-white/10 px-4 sm:pl-8 sm:pr-0">
              <div className="text-[17px] font-bold sm:text-2xl">
                Prague
              </div>

              <div className="mt-1 text-xs leading-5 text-[#7F8C9B] sm:text-sm">
                beyond campus
              </div>
            </div>

            <div className="border-l border-white/10 px-4 sm:pl-8 sm:pr-0">
              <div className="text-[17px] font-bold sm:text-2xl">
                BBA
              </div>

              <div className="mt-1 text-xs text-[#7F8C9B] sm:text-sm">
                together
              </div>
            </div>
          </div>
        </div>

        {/* HERO VISUAL */}

        <div className="relative">
          <div className="absolute -inset-10 rounded-full bg-[#0057FF]/10 blur-3xl" />

          <div className="relative min-h-[360px] overflow-hidden rounded-[26px] border border-white/10 bg-[#0D1D2C] sm:min-h-[420px] sm:rounded-[32px] lg:min-h-[500px]">
            {heroImageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImageUrl}
                  alt={
                    heroImageAlt ??
                    "BBA Club community"
                  }
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#071422]/75 via-[#071422]/10 to-black/10" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,87,255,0.18),transparent_45%,rgba(142,197,255,0.08))]" />

                <div className="absolute right-6 top-20 h-36 w-36 rounded-full border border-[#0057FF]/30 sm:right-8 sm:top-24 sm:h-48 sm:w-48" />

                <div className="absolute right-14 top-28 h-36 w-36 rounded-full border border-white/10 sm:right-20 sm:top-36 sm:h-48 sm:w-48" />

                <div className="absolute right-8 top-44 h-1 w-20 rotate-[-18deg] rounded-full bg-[#0057FF] sm:right-10 sm:top-52 sm:w-28" />
              </>
            )}

            <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-[#071422]/70 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#A9B5C3] backdrop-blur-md sm:left-8 sm:top-8 sm:px-4 sm:text-xs sm:tracking-[0.2em]">
              Prague · BBA · Community
            </div>

            <div className="absolute bottom-6 left-6 right-6 max-w-sm sm:bottom-9 sm:left-9 sm:right-auto">
              <p className="text-2xl font-semibold leading-tight text-white drop-shadow-sm sm:text-3xl">
                Your university experience
                <br />
                goes beyond university.
              </p>

              {!heroImageUrl && (
                <p className="mt-4 text-[#8EA0B3]">
                  Add a Hero Image in
                  Sanity to display your
                  main BBA Club photo here.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}