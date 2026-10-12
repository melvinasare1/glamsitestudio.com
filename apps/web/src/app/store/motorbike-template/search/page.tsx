import { Suspense } from "react";
import {
  getRideSearchFacets,
  listRideSearchProducts,
} from "@/components/store/motorbike-template/catalog";
import { RIDE_TEMPLATE_BASE } from "@/components/store/motorbike-template/demo-catalog";
import {
  RideSearchCatalog,
  RideSearchSkeleton,
} from "@/components/store/motorbike-template/search-catalog";
import { StorefrontTracker } from "@/components/store/StorefrontTracker";

export default async function MotorbikeTemplateSearchPage() {
  const base = RIDE_TEMPLATE_BASE;
  const products = await listRideSearchProducts();
  const facets = await getRideSearchFacets(products);

  return (
    <div>
      <StorefrontTracker storeSlug="motorbike-template" path={`${base}/search`} />
      <Suspense fallback={<RideSearchSkeleton />}>
        <RideSearchCatalog products={products} facets={facets} productBase={base} />
      </Suspense>
    </div>
  );
}
