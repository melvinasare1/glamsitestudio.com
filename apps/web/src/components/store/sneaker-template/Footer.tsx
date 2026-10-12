import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

const CATEGORIES = [
  { label: "Women", category: "Women" },
  { label: "Men", category: "Men" },
  { label: "Kids", category: "Kids" },
] as const;

export function Footer({ base, brandName }: { base: string; brandName: string }) {
  return (
    <footer className="bg-[#3C2415] text-[#F5F0EA]">
      <div className="mx-auto max-w-[1440px] px-4 pt-16 pb-8 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_auto_auto] lg:gap-10">
          <div className="max-w-sm">
            <Link
              href={base}
              className="text-[28px] font-semibold leading-none text-[#F5F0EA]"
              style={{ fontFamily: "var(--font-kicks-display), ui-serif, Georgia" }}
            >
              {brandName}
            </Link>
            <p className="mt-4 text-[13px] leading-relaxed text-[#F5F0EA]/65">
              Footwear made for everyday steps. Browse the collection, add what you want, and pay the seller by
              Mobile Money at checkout.
            </p>
          </div>

          <div>
            <p className="text-[14px] font-semibold">Join our newsletter</p>
            <form id="newsletter" action="#newsletter" className="mt-3 flex max-w-sm gap-2">
              <label className="sr-only" htmlFor="kicks-footer-email">
                Email address
              </label>
              <input
                id="kicks-footer-email"
                type="email"
                name="email"
                placeholder="Your email"
                className="h-11 min-w-0 flex-1 rounded-full border border-white/20 bg-transparent px-4 text-sm text-[#F5F0EA] outline-none placeholder:text-[#F5F0EA]/40"
              />
              <button
                type="submit"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#F5F0EA] px-5 text-sm font-semibold text-[#3C2415]"
              >
                Register
              </button>
            </form>
          </div>

          <div>
            <p className="text-[14px] font-semibold">Categories</p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-[#F5F0EA]/65">
              {CATEGORIES.map((item) => (
                <li key={item.label}>
                  <Link
                    href={`${base}/search?category=${encodeURIComponent(item.category)}`}
                    className="transition-colors hover:text-[#F5F0EA]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[14px] font-semibold">Help</p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-[#F5F0EA]/65">
              <li>
                <Link href={`${base}/search`} className="transition-colors hover:text-[#F5F0EA]">
                  Contact
                </Link>
              </li>
              <li>
                <span className="cursor-default text-[#F5F0EA]/40" title="No FAQ page yet">
                  FAQ
                </span>
              </li>
              <li>
                <span className="cursor-default text-[#F5F0EA]/40" title="No tracking page yet">
                  Tracking
                </span>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[14px] font-semibold">Legal</p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-[#F5F0EA]/40">
              <li>
                <span className="cursor-default" title="No privacy policy page yet">
                  Privacy
                </span>
              </li>
              <li>
                <span className="cursor-default" title="No terms page yet">
                  Terms
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-[12px] text-[#F5F0EA]/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brandName}. All rights reserved.{" "}
            <a
              href="https://glamsitestudio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:text-[#F5F0EA]/80 hover:underline"
            >
              Powered by Glam Site Studios
            </a>
          </p>
          <div className="flex items-center gap-4 text-[#F5F0EA]/55">
            <span aria-hidden>
              <Instagram className="h-4 w-4" strokeWidth={1.6} />
            </span>
            <span aria-hidden>
              <Facebook className="h-4 w-4" strokeWidth={1.6} />
            </span>
            <span aria-hidden>
              <Twitter className="h-4 w-4" strokeWidth={1.6} />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
