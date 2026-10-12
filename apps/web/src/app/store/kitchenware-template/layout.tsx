// Kitchenware template: a warm, editorial home/lifestyle storefront for
// kitchenware and houseware sellers. Serif display + forest/cream palette.
import { Cormorant_Garamond, Figtree } from "next/font/google";
import { CartFeedbackProvider } from "@/components/store/cart-feedback";
import { Header } from "@/components/store/kitchenware-template/Header";
import { HOMEDINE_CHROME } from "@/components/store/pdp/chrome";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";
import { storefrontBase } from "@/lib/store-path";
import { sellerForStoreLayout } from "@/lib/storefront-resolve";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-homedine-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-homedine-sans",
  weight: ["400", "500", "600"],
});

export default async function KitchenwareTemplateLayout({ children }: { children: React.ReactNode }) {
  const { storeSlug, seller } = await sellerForStoreLayout("kitchenware-template");
  const base = storefrontBase("kitchenware-template", storeSlug);
  const brandName = seller?.businessName || DEFAULT_STORE_NAME;

  return (
    <div
      className={`${display.variable} ${sans.variable} min-h-screen bg-white text-[#2B4239]`}
      style={{ fontFamily: "var(--font-homedine-sans), ui-sans-serif, system-ui" }}
    >
      <CartFeedbackProvider toastClass={HOMEDINE_CHROME.cartToastClass}>
        <Header base={base} brandName={brandName} />
        <main>{children}</main>
      </CartFeedbackProvider>
    </div>
  );
}
