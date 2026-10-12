"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

type NavLink = {
  label: string;
  href: string;
};

export function RideMobileNav({ links }: { links: readonly NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="p-1 text-white md:hidden"
        aria-expanded={open}
        aria-controls="ride-mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
      </button>
      {open ? (
        <nav
          id="ride-mobile-nav"
          className="absolute inset-x-0 top-full z-50 border-t border-white/10 bg-[#141414] px-6 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {links.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="block py-2.5 text-[14px] font-medium tracking-wide text-white/90"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </>
  );
}
