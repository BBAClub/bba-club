import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const whatWeDo = [
  {
    number: "01",
    title: "Events",
    text: "Socials, trips, career events and opportunities to meet people outside class.",
  },
  {
    number: "02",
    title: "Prague",
    text: "Student recommendations, places worth visiting and eventually partner perks around the city.",
  },
  {
    number: "03",
    title: "Study",
    text: "Tips, useful links, materials and practical resources shared across the student community.",
  },
  {
    number: "04",
    title: "Community",
    text: "A place for students from different backgrounds to connect and build something together.",
  },
];

const values = [
  {
    number: "01",
    title: "Student-led",
    text: "Built by students who understand what university life actually looks like.",
  },
  {
    number: "02",
    title: "International",
    text: "Different backgrounds, perspectives and experiences brought together in one community.",
  },
  {
    number: "03",
    title: "Practical",
    text: "Events, resources and useful information that make student life easier and more enjoyable.",
  },
  {
    number: "04",
    title: "Connected",
    text: "Creating more opportunities to meet people, discover Prague and make the most of university.",
  },
];

const roles = [
  {
    title: "President",
    name: "Mikuláš Smrčka",
    description:
      "Coordinates the club, partnerships and overall direction.",
  },
  {
    title: "Vice President",
    name: "To be added",
    description:
      "Supports operations, events and the day-to-day running of the club.",
  },
  {
    title: "Treasurer",
    name: "To be added",
    description:
      "Handles finances, administration and the club's formal responsibilities.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#071422] text-[#F6F8FB]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 py-14 md:py-20 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(0,87,255,0.16),transparent_35%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:gap-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
              About BBA Club
            </p>

            <h1 className="mt-4 max-w-4xl text-[42px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl md:mt-5 md:text-7xl">
              Built by students.
              <br />

              <span className="text-[#0057FF]">
                Made for student life.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-[#A9B5C3] md:mt-7 md:text-lg md:leading-8">
              BBA Club is a student community at VŠE focused on
              events, connections, useful resources and helping
              students make more of their time in Prague.
            </p>
          </div>

          {/* IDEA */}
          <div className="rounded-[20px] border border-white/10 bg-[#0D1D2C] p-5 md:rounded-[26px] md:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8EC5FF] md:text-xs">
              The idea
            </p>

            <p className="mt-3 text-lg font-medium leading-7 text-white md:mt-4 md:text-xl md:leading-8">
              University should be more than lectures, deadlines
              and exams.
            </p>

            <p className="mt-3 text-sm leading-6 text-[#A9B5C3] md:mt-4 md:text-base md:leading-7">
              BBA Club exists to make it easier to meet people,
              discover opportunities and build a stronger student
              community around the programme.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
            What we do
          </p>

          <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.03em] md:text-5xl">
            A club that works beyond the classroom.
          </h2>

          {/* MOBILE */}
          <div className="mt-7 space-y-3 md:hidden">
            {whatWeDo.map((item) => (
              <article
                key={item.title}
                className={`rounded-[18px] border p-5 ${
                  item.number === "04"
                    ? "border-[#0057FF]/30 bg-[#0D2035]"
                    : "border-white/10 bg-[#0B1A29]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 text-xs font-semibold text-[#5790FF]">
                    {item.number}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">
                        {item.title}
                      </h3>

                      <span className="text-[#5790FF]">→</span>
                    </div>

                    <p className="mt-1.5 text-sm leading-5 text-[#8EA0B3]">
                      {item.text}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* DESKTOP */}
          <div className="mt-10 hidden gap-5 md:grid md:grid-cols-2 lg:grid-cols-4">
            {whatWeDo.map((item) => (
              <article
                key={item.title}
                className={`rounded-[24px] border p-7 ${
                  item.number === "04"
                    ? "border-[#0057FF]/30 bg-[#0D2035]"
                    : "border-white/10 bg-[#0B1A29]"
                }`}
              >
                <span className="text-sm font-semibold text-[#5790FF]">
                  {item.number}
                </span>

                <h3 className="mt-8 text-2xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-[#8EA0B3]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="border-t border-white/10 bg-[#091725] px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
                Our values
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-5xl">
                What BBA Club should feel like.
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-[#A9B5C3] md:mt-5 md:text-base md:leading-7">
                The goal is not to create another formal university
                organisation. It should feel useful, open and easy
                to become part of.
              </p>
            </div>

            {/* MOBILE */}
            <div className="space-y-3 sm:hidden">
              {values.map((value) => (
                <article
                  key={value.title}
                  className="rounded-[18px] border border-white/10 bg-[#0B1A29] p-5"
                >
                  <div className="flex gap-4">
                    <span className="text-xs font-semibold text-[#5790FF]">
                      {value.number}
                    </span>

                    <div>
                      <h3 className="text-lg font-semibold">
                        {value.title}
                      </h3>

                      <p className="mt-1.5 text-sm leading-5 text-[#8EA0B3]">
                        {value.text}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* TABLET / DESKTOP */}
            <div className="hidden gap-4 sm:grid sm:grid-cols-2">
              {values.map((value) => (
                <article
                  key={value.title}
                  className="rounded-[24px] border border-white/10 bg-[#0B1A29] p-7"
                >
                  <span className="text-sm font-semibold text-[#5790FF]">
                    {value.number}
                  </span>

                  <h3 className="mt-8 text-2xl font-semibold">
                    {value.title}
                  </h3>

                  <p className="mt-3 leading-7 text-[#8EA0B3]">
                    {value.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="border-t border-white/10 px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
              The team
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-5xl">
              The people behind the club.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#A9B5C3] md:mt-4 md:text-base">
              Meet the people helping build and run BBA Club.
            </p>
          </div>

          {/* MOBILE TEAM */}
          <div className="mt-7 space-y-3 md:hidden">
            {roles.map((role) => (
              <article
                key={role.title}
                className="rounded-[18px] border border-white/10 bg-[#0B1A29] p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0D2035] text-sm font-bold text-[#8EC5FF]">
                    {role.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5790FF]">
                      {role.title}
                    </p>

                    <h3 className="mt-1 text-lg font-semibold">
                      {role.name}
                    </h3>

                    <p className="mt-1.5 text-sm leading-5 text-[#8EA0B3]">
                      {role.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* DESKTOP TEAM */}
          <div className="mt-10 hidden gap-5 md:grid md:grid-cols-3">
            {roles.map((role) => (
              <article
                key={role.title}
                className="rounded-[24px] border border-white/10 bg-[#0B1A29] p-7"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0D2035] text-xl font-bold text-[#8EC5FF]">
                  {role.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-[#5790FF]">
                  {role.title}
                </p>

                <h3 className="mt-2 text-2xl font-semibold">
                  {role.name}
                </h3>

                <p className="mt-4 leading-7 text-[#8EA0B3]">
                  {role.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section className="border-t border-white/10 bg-[#091725] px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-7 rounded-[24px] border border-[#0057FF]/30 bg-[linear-gradient(120deg,#0D2035,#091725)] p-6 md:rounded-[30px] md:p-12 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8EC5FF] md:text-xs">
                Who is it for?
              </p>

              <h2 className="mt-3 text-2xl font-bold md:mt-4 md:text-4xl">
                Anyone who wants to be part of the community.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A9B5C3] md:mt-5 md:text-base md:leading-7">
                BBA Club is built around BBA students, but the goal
                is to create events and opportunities that can
                connect students across English-taught programmes
                and the wider VŠE community.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:gap-3">
              {[
                "Meet people",
                "Join events",
                "Discover Prague",
                "Share resources",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-[#071422]/60 px-3 py-3 text-xs font-medium text-[#A9B5C3] md:rounded-2xl md:p-5 md:text-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="border-t border-white/10 px-6 py-14 md:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-7 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8EC5FF] md:text-xs">
                Contact
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-4xl">
                Want to get in touch?
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#A9B5C3] md:mt-5 md:text-base md:leading-7">
                Questions, partnerships, event ideas or just want
                to know more about the club?
              </p>
            </div>

            {/* MOBILE CONTACT */}
            <div className="space-y-3 sm:hidden">
              <a
                href="https://instagram.com/bbaclubvse"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-[18px] border border-white/10 bg-[#0B1A29] p-5 transition hover:border-[#0057FF]/50"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
                    Instagram
                  </p>

                  <p className="mt-1 text-base font-semibold">
                    @bbaclubvse
                  </p>
                </div>

                <span className="text-[#5790FF]">→</span>
              </a>

              <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-[#0B1A29] p-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71869A]">
                    Email
                  </p>

                  <p className="mt-1 text-base font-semibold text-[#A9B5C3]">
                    bba.club@vse.cz
                  </p>
                </div>
              </div>
            </div>

            {/* TABLET / DESKTOP CONTACT */}
            <div className="hidden gap-4 sm:grid sm:grid-cols-2">
              <a
                href="https://instagram.com/bbaclubvse"
                target="_blank"
                rel="noreferrer"
                className="group rounded-[22px] border border-white/10 bg-[#0B1A29] p-6 transition hover:border-[#0057FF]/50"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71869A]">
                  Instagram
                </p>

                <p className="mt-5 text-xl font-semibold">
                  @bbaclubvse
                </p>

                <div className="mt-6 flex justify-end text-[#5790FF] transition group-hover:translate-x-1">
                  →
                </div>
              </a>

              <div className="rounded-[22px] border border-white/10 bg-[#0B1A29] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71869A]">
                  Email
                </p>

                <p className="mt-5 text-xl font-semibold">
                  Coming soon
                </p>

                <p className="mt-3 text-sm text-[#71869A]">
                  We can add the official club email here once you
                  decide which address to use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}