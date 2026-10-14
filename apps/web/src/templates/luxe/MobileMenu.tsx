"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  if (!links.length) return null;
  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="lx-mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex size-11 items-center justify-center text-[var(--lx-dark-ink)]"
      >
        {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
      </button>
      {open ? (
        <nav
          id="lx-mobile-menu"
          aria-label="Menu"
          className="absolute inset-x-0 top-full border-t border-white/10 bg-[var(--lx-dark)] px-5 pb-6 pt-2"
        >
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-white/10 py-4 font-[family-name:var(--lx-heading)] text-xl text-[var(--lx-dark-ink)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
