import { Suspense } from "react";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { listTemplateAProducts } from "@/components/store/template-a/catalog";
import { storefrontBase } from "@/lib/store-path";
import { TemplateACatalogSkeleton, TemplateACatalogView } from "./catalog-view";

export async function TemplateAHome({ storeSlug }: { storeSlug?: string } = {}) {
  const base = storefrontBase("template-a", storeSlug);
  const products = await listTemplateAProducts(storeSlug);

  return (
    <div>
      <StorefrontTracker storeSlug={storeSlug ?? "template-a"} path={base} />
      <Suspense fallback={<TemplateACatalogSkeleton />}>
        <TemplateACatalogView products={products} productBase={base} />
      </Suspense>
    </div>
  );
}
