// Kicks — a warm sneaker / footwear storefront. Serif display + espresso accents.
import { Fraunces, Manrope } from "next/font/google";
import { CartFeedbackProvider } from "@/components/store/cart-feedback";
import { Footer } from "@/components/store/sneaker-template/Footer";
import { Header } from "@/components/store/sneaker-template/Header";
import { KICKS_CHROME } from "@/components/store/pdp/chrome";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";
import { storefrontBase } from "@/lib/store-path";
import { sellerForStoreLayout } from "@/lib/storefront-resolve";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-kicks-display",
  weight: ["600", "700"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-kicks-sans",
  weight: ["400", "500", "600", "700"],
});

export default async function SneakerTemplateLayout({ children }: { children: React.ReactNode }) {
  const { storeSlug, seller } = await sellerForStoreLayout("sneaker-template");
  const base = storefrontBase("sneaker-template", storeSlug);
  const brandName = seller?.businessName || DEFAULT_STORE_NAME;

  return (
    <div
      className={`${display.variable} ${sans.variable} min-h-screen bg-[#F5F0EA] text-[#2A1C14]`}
      style={{ fontFamily: "var(--font-kicks-sans), ui-sans-serif, system-ui" }}
    >
      <CartFeedbackProvider toastClass={KICKS_CHROME.cartToastClass}>
        <Header base={base} brandName={brandName} />
        <main>{children}</main>
        <Footer base={base} brandName={brandName} />
      </CartFeedbackProvider>
    </div>
  );
}
