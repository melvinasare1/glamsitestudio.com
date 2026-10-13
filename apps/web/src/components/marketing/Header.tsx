"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { marketingNav, ownerLoginHref, ownerSignupHref } from "./nav";

export default function Header() {
  const [open, setOpen] = useState(false);
  const loginHref = ownerLoginHref();
  const onboardingHref = ownerSignupHref();

  return (
    <header className="sticky top-0 z-50 border-b border-wire bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-display text-lg font-semibold text-ink-950">
          Glam Site Studios
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-ink-700 md:flex">
          {marketingNav.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-ink-950">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={loginHref}
            className="hidden text-sm font-medium text-ink-700 transition hover:text-ink-950 md:inline-flex"
          >
            Login
          </a>
          <a
            href={onboardingHref}
            className="hidden rounded-full bg-navy px-5 py-2 text-sm font-medium text-white transition hover:bg-navy/90 md:inline-flex"
          >
            Get your website
          </a>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full text-navy md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" strokeWidth={2} /> : <Menu className="size-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-nav" className="border-t border-wire px-6 py-4 md:hidden">
          <div className="mx-auto flex max-w-5xl flex-col gap-1">
            {marketingNav.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-2.5 text-sm text-ink-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <a
                href={loginHref}
                className="inline-flex items-center justify-center rounded-full border border-navy px-5 py-2.5 text-sm font-medium text-navy"
                onClick={() => setOpen(false)}
              >
                Login
              </a>
              <a
                href={onboardingHref}
                className="inline-flex items-center justify-center rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white"
                onClick={() => setOpen(false)}
              >
                Get your website
              </a>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
