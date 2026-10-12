import { Suspense } from "react";
import { listTemplateASearchProducts } from "@/components/store/template-a/catalog";
import { CatalogSearch, CatalogSearchSkeleton } from "@/components/store/catalog-search";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { storefrontBase } from "@/lib/store-path";

export async function TemplateASearchView({ storeSlug }: { storeSlug?: string } = {}) {
  const base = storefrontBase("template-a", storeSlug);
  const products = await listTemplateASearchProducts(storeSlug);

  return (
    <div>
      <StorefrontTracker storeSlug={storeSlug ?? "template-a"} path={`${base}/search`} />
      <Suspense fallback={<CatalogSearchSkeleton theme="styleco" />}>
        <CatalogSearch products={products} productBase={base} theme="styleco" />
      </Suspense>
    </div>
  );
}
