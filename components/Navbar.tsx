"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

type NavbarProps = {
  activePage?: "home" | "events" | "explore" | "study" | "about";
};

const navItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Events",
    href: "/events",
  },
  {
    label: "Explore Prague",
    href: "/explore",
  },
  {
    label: "Study Hub",
    href: "/study",
  },
  {
    label: "About",
    href: "/about",
  },
];

export default function Navbar(_: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Zavře menu při přechodu na jinou stránku
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#071422]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* MAIN NAVBAR */}
        <div className="flex h-[76px] items-center justify-between">
          <Logo />

          {/* DESKTOP NAVIGATION */}
          <div className="hidden items-center gap-8 text-sm md:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "text-white"
                      : "text-[#A9B5C3] transition hover:text-white"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* MOBILE HAMBURGER */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 md:hidden"
          >
            {menuOpen ? (
              /* X ICON */
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              /* HAMBURGER ICON */
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 7H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M4 12H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M4 17H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-white/10 pb-5 pt-3 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-xl px-4 py-4 text-base transition ${
                      active
                        ? "bg-[#0057FF]/20 text-white"
                        : "text-[#A9B5C3] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>

                    {active ? (
                      <span className="h-2 w-2 rounded-full bg-[#0057FF]" />
                    ) : (
                      <span className="text-[#53687D]">→</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}