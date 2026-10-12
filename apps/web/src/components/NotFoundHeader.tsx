import Link from "next/link";
import { Heart, Search, ShoppingCart, User } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/signup", label: "Contact" },
  { href: "/#how-it-works", label: "About" },
  { href: "/signup", label: "Sign Up" },
] as const;

export function NotFoundHeader() {
  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-[1170px] items-center gap-4 px-4 py-4 sm:px-6 md:gap-8 md:py-5">
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-black md:text-2xl">
          Glam Site Studios
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 text-base text-black lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`transition-opacity hover:opacity-70 ${
                link.label === "Home" ? "underline decoration-black decoration-1 underline-offset-8" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-4 md:gap-5">
          <label className="relative hidden min-w-0 sm:block sm:w-[220px] md:w-[243px]">
            <span className="sr-only">Search</span>
            <input
              type="search"
              placeholder="What are you looking for?"
              className="h-10 w-full rounded bg-[#F5F5F5] py-2 pl-4 pr-10 text-xs text-black outline-none placeholder:text-black/50"
            />
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black"
              strokeWidth={1.75}
            />
          </label>

          <div className="flex items-center gap-3 text-black md:gap-4">
            <span className="p-0.5" aria-hidden>
              <Heart className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <span className="p-0.5" aria-hidden>
              <ShoppingCart className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <Link href="/signup" aria-label="Account" className="p-0.5">
              <User className="h-5 w-5" strokeWidth={1.6} />
            </Link>
          </div>
        </div>
      </div>
      <nav className="flex items-center gap-5 overflow-x-auto px-4 pb-3 text-sm text-black sm:px-6 lg:hidden">
        {navLinks.map((link) => (
          <Link key={link.label} href={link.href} className="shrink-0">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
