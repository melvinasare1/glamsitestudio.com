// Imports template: a GHS grocery / imported-goods catalogue with a
// professional blue visual identity. Inter only — no display/serif pairing.
import { Inter } from "next/font/google";
import Link from "next/link";
import { storefrontContentValue } from "@glamsite/shared/storefront-content-schema";
import { CartFeedbackProvider } from "@/components/store/cart-feedback";
import { Header } from "@/components/store/imports-template/Header";
import { IMPORTS_CHROME } from "@/components/store/pdp/chrome";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";
import { storefrontBase } from "@/lib/store-path";
import { sellerForStoreLayout } from "@/lib/storefront-resolve";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-imports",
  display: "swap",
});

export default async function ImportsTemplateLayout({ children }: { children: React.ReactNode }) {
  const { storeSlug, seller } = await sellerForStoreLayout("imports-template");
  const base = storefrontBase("imports-template", storeSlug);
  const brandName = seller?.businessName || DEFAULT_STORE_NAME;
  const logoUrl = storefrontContentValue(seller?.storeContent, "logoUrl");
  const phone = seller?.phone?.trim();

  return (
    <div
      className={`${inter.variable} flex min-h-screen flex-col bg-[#f7f9fc] text-[#1a1f2b]`}
      style={{ fontFamily: "var(--font-imports), ui-sans-serif, system-ui" }}
    >
      <CartFeedbackProvider toastClass={IMPORTS_CHROME.cartToastClass}>
        <Header base={base} brandName={brandName} logoUrl={logoUrl || undefined} />
        <main className="flex-1">{children}</main>
        <footer className="mt-auto bg-[#1266b5] text-white">
          <div className="mx-auto grid max-w-[90rem] gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            <div className="lg:col-span-2">
              <Link href={base} className="flex items-center gap-2 text-lg font-semibold">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-7 w-auto max-w-[100px] object-contain" />
                ) : null}
                {brandName}
              </Link>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
                Everyday imported goods for Ghanaian homes. Browse the catalogue, add what you need,
                and pay the seller by Mobile Money.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide uppercase">Shop</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href={base} className="text-white/85 hover:text-white hover:underline">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href={`${base}/search`} className="text-white/85 hover:text-white hover:underline">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link href={`${base}/contact`} className="text-white/85 hover:text-white hover:underline">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide uppercase">Contact</p>
              {phone ? (
                <p className="mt-4 text-sm text-white/85">{phone}</p>
              ) : (
                <p className="mt-4 text-sm text-white/85">Pay by Mobile Money at checkout.</p>
              )}
            </div>
          </div>
          <div className="border-t border-white/15">
            <p className="mx-auto max-w-[90rem] px-4 py-5 text-center text-xs text-white/70 sm:px-6 lg:px-8">
              © {new Date().getFullYear()} {brandName}. All rights reserved.{" "}
              <a
                href="https://glamsitestudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:text-white hover:underline"
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
