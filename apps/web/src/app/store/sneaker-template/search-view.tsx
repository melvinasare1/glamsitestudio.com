import { Suspense } from "react";
import { listSneakerSearchProducts } from "@/components/store/sneaker-template/catalog";
import { CatalogSearch, CatalogSearchSkeleton } from "@/components/store/catalog-search";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { storefrontBase } from "@/lib/store-path";

export async function SneakerSearchView({ storeSlug }: { storeSlug?: string } = {}) {
  const base = storefrontBase("sneaker-template", storeSlug);
  const products = await listSneakerSearchProducts(storeSlug);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <StorefrontTracker storeSlug={storeSlug ?? "sneaker-template"} path={`${base}/search`} />
      <Suspense fallback={<CatalogSearchSkeleton theme="kicks" />}>
        <CatalogSearch products={products} productBase={base} theme="kicks" />
      </Suspense>
    </div>
  );
}
