import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050E17] px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* BRAND */}
          <div>
            <Logo />

            <p className="mt-5 max-w-sm leading-7 text-[#71869A]">
              Events, Prague, study resources and a community
              that makes student life better.
            </p>

            <div className="mt-6 space-y-1 text-xs leading-5 text-[#53687D]">
              <p>BBA Club, z.s.</p>
              <p>IČO: 29854059</p>
              <p>Opatovická 159/17</p>
              <p>110 00 Praha 1</p>
            </div>
          </div>

          {/* NAVIGATION */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#71869A]">
              Explore
            </p>

            <div className="mt-5 flex flex-col gap-3 text-sm text-[#A9B5C3]">
              <Link
                href="/events"
                className="transition hover:text-white"
              >
                Events
              </Link>

              <Link
                href="/explore"
                className="transition hover:text-white"
              >
                Explore Prague
              </Link>

              <Link
                href="/study"
                className="transition hover:text-white"
              >
                Study Hub
              </Link>

              <Link
                href="/about"
                className="transition hover:text-white"
              >
                About
              </Link>
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#71869A]">
              Contact
            </p>

            <div className="mt-5 flex flex-col gap-3 text-sm text-[#A9B5C3]">
              <a
                href="mailto:bba.club@vse.cz"
                className="transition hover:text-white"
              >
                bba.club@vse.cz
              </a>

              <a
                href="https://instagram.com/bbaclubvse"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-white"
              >
                Instagram
              </a>

              <a
                href="https://www.vse.cz/"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-white"
              >
                VŠE Prague
              </a>
            </div>
          </div>

          {/* LEGAL */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#71869A]">
              Legal
            </p>

            <div className="mt-5 flex flex-col gap-3 text-sm text-[#A9B5C3]">
              <Link
                href="/terms"
                className="transition hover:text-white"
              >
                Terms & Conditions
              </Link>

              <Link
                href="/privacy"
                className="transition hover:text-white"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-7 text-xs text-[#53687D] md:flex-row md:items-center">
          <div className="space-y-1">
            <p>© 2026 BBA Club, z.s.</p>

            <p>
              Registered under file no. L 82337 at the Municipal Court
              in Prague.
            </p>
          </div>

          <p>Made by students, for students.</p>
        </div>
      </div>
    </footer>
  );
}