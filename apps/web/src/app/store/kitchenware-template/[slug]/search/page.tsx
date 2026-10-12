import { KitchenwareSearchView } from "@/app/store/kitchenware-template/search-view";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function KitchenwareSellerSearchPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSellerForTemplate(params.slug, "kitchenware-template");
  return <KitchenwareSearchView storeSlug={params.slug} />;
}
