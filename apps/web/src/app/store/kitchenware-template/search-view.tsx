import { Suspense } from "react";
import {
  getKitchenwareSearchFacets,
  listKitchenwareSearchProducts,
} from "@/components/store/kitchenware-template/catalog";
import {
  KitchenwareSearchCatalog,
  KitchenwareSearchSkeleton,
} from "@/components/store/kitchenware-template/search-catalog";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { storefrontBase } from "@/lib/store-path";

export async function KitchenwareSearchView({ storeSlug }: { storeSlug?: string } = {}) {
  const base = storefrontBase("kitchenware-template", storeSlug);
  const products = await listKitchenwareSearchProducts(storeSlug);
  const facets = await getKitchenwareSearchFacets(products);

  return (
    <div>
      <StorefrontTracker storeSlug={storeSlug ?? "kitchenware-template"} path={`${base}/search`} />
      <Suspense fallback={<KitchenwareSearchSkeleton />}>
        <KitchenwareSearchCatalog products={products} facets={facets} productBase={base} />
      </Suspense>
    </div>
  );
}
