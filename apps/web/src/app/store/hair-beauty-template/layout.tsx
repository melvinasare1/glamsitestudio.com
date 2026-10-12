// Hair & Beauty template: warm cream/olive luxury storefront for wigs and bundles.
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import Link from "next/link";
import { storefrontContentValue } from "@glamsite/shared/storefront-content-schema";
import { CartFeedbackProvider } from "@/components/store/cart-feedback";
import { HairBeautyChrome } from "@/components/store/hair-beauty-template/HairBeautyChrome";
import { HAIR_BEAUTY_CHROME } from "@/components/store/pdp/chrome";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";
import { storefrontBase } from "@/lib/store-path";
import { sellerForStoreLayout } from "@/lib/storefront-resolve";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-hair-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Montserrat({
  subsets: ["latin"],
  variable: "--font-hair-body",
  weight: ["400", "500", "600"],
});

export default async function HairBeautyTemplateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { storeSlug, seller } = await sellerForStoreLayout("hair-beauty-template");
  const base = storefrontBase("hair-beauty-template", storeSlug);
  const brandName = seller?.businessName || DEFAULT_STORE_NAME;
  const logoUrl = storefrontContentValue(seller?.storeContent, "logoUrl");
  const phone = seller?.phone?.trim();

  const footer = (
    <footer className="mt-auto bg-[#efe6db] text-[#4f4a3d]">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <Link
            href={base}
            className="flex items-center gap-2 text-lg font-medium"
            style={{ fontFamily: "var(--font-hair-display), ui-serif, Georgia" }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-7 w-auto max-w-[100px] object-contain" />
            ) : null}
            {brandName}
          </Link>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#4f4a3d]/70">
            Premium human hair — wigs, bundles, and extensions crafted for every crown. Browse, add
            to cart, and pay by Mobile Money.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide uppercase">Shop</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href={base} className="text-[#4f4a3d]/70 hover:text-[#4f4a3d] hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link
                href={`${base}/search`}
                className="text-[#4f4a3d]/70 hover:text-[#4f4a3d] hover:underline"
              >
                Shop
              </Link>
            </li>
            <li>
              <Link
                href={`${base}/contact`}
                className="text-[#4f4a3d]/70 hover:text-[#4f4a3d] hover:underline"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide uppercase">Contact</p>
          {phone ? (
            <p className="mt-4 text-sm text-[#4f4a3d]/70">{phone}</p>
          ) : (
            <p className="mt-4 text-sm text-[#4f4a3d]/70">Pay by Mobile Money at checkout.</p>
          )}
        </div>
      </div>
      <div className="border-t border-[#d9cfc3]">
        <p className="mx-auto max-w-[90rem] px-4 py-5 text-center text-xs text-[#4f4a3d]/55 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {brandName}. All rights reserved.{" "}
          <a
            href="https://glamsitestudio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-[#4f4a3d] hover:underline"
          >
            Powered by Glam Site Studios
          </a>
        </p>
      </div>
    </footer>
  );

  return (
    <div
      className={`${display.variable} ${sans.variable} flex min-h-screen flex-col bg-[#f7f1df] text-[#4f4a3d]`}
      style={{ fontFamily: "var(--font-hair-body), ui-sans-serif, system-ui" }}
    >
      <CartFeedbackProvider toastClass={HAIR_BEAUTY_CHROME.cartToastClass}>
        <HairBeautyChrome
          base={base}
          brandName={brandName}
          logoUrl={logoUrl || undefined}
          footer={footer}
        >
          {children}
        </HairBeautyChrome>
      </CartFeedbackProvider>
    </div>
  );
}
