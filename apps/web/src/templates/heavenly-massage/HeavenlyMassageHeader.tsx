"use client";

import { useState } from "react";
import { ArrowRight, CalendarDays, Menu, Sprout, X } from "lucide-react";
import { opensInNewTab } from "../shared";

type NavLink = { href: string; label: string };

export function HeavenlyMassageHeader({
  businessName,
  logo,
  bookingHref,
}: {
  businessName: string;
  logo: string;
  bookingHref: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links: NavLink[] = [
    { href: "#treatments", label: "Treatments" },
    { href: "#about", label: "About" },
    { href: "#reviews", label: "Testimonials" },
    { href: "#hours", label: "Opening hours" },
    { href: "#contact", label: "Contact" },
  ];
  const external = opensInNewTab(bookingHref)
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--hm-line)] bg-[var(--hm-cream)]/95 text-[var(--hm-ink)] backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-4 px-5 md:px-8 lg:px-12">
        <a href="#top" aria-label={`${businessName} home`} className="flex min-w-0 items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- business logo dimensions vary.
            <img src={logo} alt={businessName} className="max-h-12 w-auto max-w-36 object-contain" />
          ) : (
            <>
              <Sprout className="size-9 shrink-0 text-[var(--hm-olive)]" strokeWidth={1.35} aria-hidden />
              <span className="flex min-w-0 flex-col font-[family-name:var(--hm-heading)] text-xl leading-[0.95] tracking-[-0.04em] sm:text-2xl">
                <span className="truncate">{businessName}</span>
                <span className="mt-1 font-[family-name:var(--hm-body)] text-[8px] font-medium uppercase tracking-[0.28em] text-[var(--hm-muted)]">
                  Massage · Wellness
                </span>
              </span>
            </>
          )}
        </a>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex xl:gap-9">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium transition-colors hover:text-[var(--hm-olive)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={bookingHref}
            {...external}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--hm-olive)] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--hm-olive-dark)] sm:px-5"
          >
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Book Appointment</span>
            <span className="sm:hidden">Book</span>
            <ArrowRight className="hidden size-4 sm:block" aria-hidden />
          </a>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full border border-[var(--hm-line)] text-[var(--hm-ink)] transition hover:bg-white lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="heavenly-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="heavenly-mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-[var(--hm-line)] bg-[var(--hm-cream)] px-5 pb-4 pt-2 lg:hidden"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block border-b border-[var(--hm-line)] py-3.5 text-sm font-medium last:border-0"
            >
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
