import { Suspense } from "react";
import { listImportsProducts } from "@/components/store/imports-template/catalog";
import {
  ImportsSearchCatalog,
  ImportsSearchSkeleton,
} from "@/components/store/imports-template/search-catalog";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { storefrontBase } from "@/lib/store-path";

export async function ImportsSearchView({ storeSlug }: { storeSlug?: string } = {}) {
  const base = storefrontBase("imports-template", storeSlug);
  const products = await listImportsProducts(storeSlug);

  return (
    <div>
      <StorefrontTracker storeSlug={storeSlug ?? "imports-template"} path={`${base}/search`} />
      <Suspense fallback={<ImportsSearchSkeleton />}>
        <ImportsSearchCatalog products={products} productBase={base} />
      </Suspense>
    </div>
  );
}
