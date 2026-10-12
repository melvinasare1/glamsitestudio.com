import { CatalogSearchSkeleton } from "@/components/store/catalog-search";

export default function SneakerSellerSearchLoading() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <CatalogSearchSkeleton theme="kicks" />
    </div>
  );
}
