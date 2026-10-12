// Template A — "Styleco": a general clothing/apparel catalog with sidebar filters
// for fashion sellers. Plus Jakarta Sans + black/white with a warm orange accent.
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { storefrontContentValue } from "@glamsite/shared/storefront-content-schema";
import { StoreSearchForm } from "@/components/store/StoreSearchForm";
import { CartFeedbackProvider } from "@/components/store/cart-feedback";
import { STYLECO_CHROME } from "@/components/store/pdp/chrome";
import { STYLECO_CATEGORIES } from "@/components/store/template-a/categories";
import { CartIconLink } from "@/components/store/template-a/CartIconLink";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";
import { storefrontBase } from "@/lib/store-path";
import { sellerForStoreLayout } from "@/lib/storefront-resolve";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-styleco",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const navLinks = ["Shop", "Women", "Men", "Children"] as const;

export default async function TemplateALayout({ children }: { children: React.ReactNode }) {
  const { storeSlug, seller } = await sellerForStoreLayout("template-a");
  const base = storefrontBase("template-a", storeSlug);
  const brandName = seller?.businessName || DEFAULT_STORE_NAME;
  const logoUrl = storefrontContentValue(seller?.storeContent, "logoUrl");

  return (
    <div
      className={`${sans.variable} min-h-screen bg-white text-black`}
      style={{ fontFamily: "var(--font-styleco), ui-sans-serif, system-ui" }}
    >
      <CartFeedbackProvider toastClass={STYLECO_CHROME.cartToastClass}>
        <header className="border-b border-black/5 bg-white">
          <div className="mx-auto flex max-w-[1400px] items-center gap-5 px-5 py-4 md:gap-8 md:px-8">
            <Link
              href={base}
              className="flex shrink-0 items-center gap-2 text-[22px] font-extrabold italic leading-none tracking-tight md:text-[26px]"
            >
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-8 w-auto max-w-[120px] object-contain" />
              ) : null}
              {brandName}
            </Link>

            <nav className="hidden items-center gap-6 text-[15px] font-medium text-black md:flex">
              {navLinks.map((label) => (
                <Link key={label} href={`${base}#catalog`} className="transition-opacity hover:opacity-60">
                  {label}
                </Link>
              ))}
            </nav>

            <StoreSearchForm
              action={`${base}/search`}
              placeholder="Search"
              className="relative ml-auto w-1/2 max-w-[240px] min-w-0"
              inputClassName="h-11 w-full rounded-full bg-[#EFEFEF] px-5 text-sm text-black outline-none placeholder:text-black/35"
            />

            <CartIconLink href={`${base}/cart`} />
          </div>
          <nav className="flex items-center gap-5 overflow-x-auto px-5 pb-3 text-[14px] font-medium text-black md:hidden md:px-8">
            {navLinks.map((label) => (
              <Link key={label} href={`${base}#catalog`} className="shrink-0">
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-[1400px] px-5 py-10 md:px-8 [&:has(#catalog)]:max-w-none [&:has(#catalog)]:p-0">
          {children}
        </main>

        <footer className="border-t border-black/8 bg-black text-white">
          <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-14">
            <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between sm:gap-16">
              <div className="max-w-sm">
                <Link
                  href={base}
                  className="flex items-center gap-2 text-[20px] font-extrabold italic leading-none tracking-tight"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-7 w-auto max-w-[100px] object-contain" />
                  ) : null}
                  {brandName}
                </Link>
                <p className="mt-4 text-[13px] leading-relaxed text-white/50">
                  Quality clothing made for everyday wear. New drops and classics, all in one shop.
                </p>
                <div className="mt-5 flex items-center gap-4 text-white/40" title="Social profiles are not configured">
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

              <div>
                <p className="text-[13px] font-semibold uppercase tracking-wide">Shop</p>
                <ul className="mt-4 space-y-2 text-[13px] text-white/55">
                  {STYLECO_CATEGORIES.map((label) => (
                    <li key={label}>
                      <Link
                        href={`${base}?category=${encodeURIComponent(label)}#catalog`}
                        className="transition-colors hover:text-white"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-12 border-t border-white/10 pt-6 text-[12px] text-white/40">
              © {new Date().getFullYear()} {brandName}. All rights reserved.{" "}
              <a
                href="https://glamsitestudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:text-white/70 hover:underline"
              >
                Powered by Glam Site Studios
              </a>
            </p>
          </div>
        </footer>
      </CartFeedbackProvider>
    </div>
  );
}
