import { storefrontContentValue } from "@glamsite/shared/storefront-content-schema";
import { HairBeautyHero } from "@/components/store/hair-beauty-template/HairBeautyHero";
import { HomeCatalogue } from "@/components/store/hair-beauty-template/HomeCatalogue";
import { listHairProducts } from "@/components/store/hair-beauty-template/catalog";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { getStorefrontSellerBySlug } from "@/lib/live-catalog";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";
import { storefrontBase } from "@/lib/store-path";

const DEFAULT_HEADLINE = "Luxury Hair Crafted For Every Crown";
const DEFAULT_SUBTEXT =
  "Premium quality wigs and bundles designed to elevate your natural beauty.";

export async function HairBeautyHome({ storeSlug }: { storeSlug?: string } = {}) {
  const base = storefrontBase("hair-beauty-template", storeSlug);
  const seller = storeSlug ? await getStorefrontSellerBySlug(storeSlug) : null;
  const brandName = seller?.businessName || DEFAULT_STORE_NAME;
  const heroHeadline = storefrontContentValue(seller?.storeContent, "heroHeadline", DEFAULT_HEADLINE);
  const heroSubtext = storefrontContentValue(seller?.storeContent, "heroSubtext", DEFAULT_SUBTEXT);
  const products = await listHairProducts(storeSlug);

  return (
    <div>
      <StorefrontTracker storeSlug={storeSlug ?? "hair-beauty-template"} path={base} />

      <HairBeautyHero
        base={base}
        brandName={brandName}
        headline={heroHeadline}
        subtext={heroSubtext}
      />

      <div className="mx-auto max-w-[90rem] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <HomeCatalogue products={products} productBase={base} />
      </div>
    </div>
  );
}
