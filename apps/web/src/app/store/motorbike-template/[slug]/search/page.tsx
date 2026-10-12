import { Suspense } from "react";
import {
  getRideSearchFacets,
  listRideSearchProducts,
} from "@/components/store/motorbike-template/catalog";
import { rideStoreBase } from "@/components/store/motorbike-template/demo-catalog";
import {
  RideSearchCatalog,
  RideSearchSkeleton,
} from "@/components/store/motorbike-template/search-catalog";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function MotorbikeTemplateSellerSearchPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSellerForTemplate(params.slug, "motorbike-template");
  const base = rideStoreBase(params.slug);
  const products = await listRideSearchProducts(params.slug);
  const facets = await getRideSearchFacets(products, params.slug);

  return (
    <div>
      <StorefrontTracker storeSlug={params.slug} path={`${base}/search`} />
      <Suspense fallback={<RideSearchSkeleton />}>
        <RideSearchCatalog products={products} facets={facets} productBase={base} />
      </Suspense>
    </div>
  );
}
