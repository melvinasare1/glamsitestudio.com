"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { marketingNav, ownerLoginHref, ownerSignupHref } from "./nav";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-didone text-[1.35rem] leading-none tracking-tight ${className}`}>
      Glam Site <span className="italic">Studios</span>
    </span>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-porcelain/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href="/" className="text-plum" aria-label="Glam Site Studios home">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 text-sm text-mauve md:flex">
          {marketingNav.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-plum">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={ownerLoginHref()} className="hidden px-3 py-2 text-sm text-mauve transition-colors hover:text-plum md:inline-flex">
            Log in
          </a>
          <a
            href={ownerSignupHref()}
            className="hidden rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-berry-dark md:inline-flex"
          >
            Get your website
          </a>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full text-plum md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-hairline px-5 pb-5 pt-2 md:hidden">
          {marketingNav.map((link) => (
            <a key={link.href} href={link.href} className="block py-3 text-base text-plum" onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="mt-3 grid gap-2">
            <a href={ownerSignupHref()} className="rounded-full bg-berry px-5 py-3 text-center text-sm font-semibold text-white">
              Get your website
            </a>
            <a href={ownerLoginHref()} className="rounded-full border border-plum/20 px-5 py-3 text-center text-sm text-plum">
              Log in
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
