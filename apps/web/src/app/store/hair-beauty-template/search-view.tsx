import { Suspense } from "react";
import { listHairProducts } from "@/components/store/hair-beauty-template/catalog";
import {
  HairSearchCatalog,
  HairSearchSkeleton,
} from "@/components/store/hair-beauty-template/search-catalog";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { storefrontBase } from "@/lib/store-path";

export async function HairSearchView({ storeSlug }: { storeSlug?: string } = {}) {
  const base = storefrontBase("hair-beauty-template", storeSlug);
  const products = await listHairProducts(storeSlug);

  return (
    <div>
      <StorefrontTracker storeSlug={storeSlug ?? "hair-beauty-template"} path={`${base}/search`} />
      <Suspense fallback={<HairSearchSkeleton />}>
        <HairSearchCatalog products={products} productBase={base} />
      </Suspense>
    </div>
  );
}
