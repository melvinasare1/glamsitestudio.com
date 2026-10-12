import { KitchenwareProductView } from "@/app/store/kitchenware-template/product-view";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function KitchenwareSellerProductPage({
  params,
}: {
  params: { slug: string; productId: string };
}) {
  await requireSellerForTemplate(params.slug, "kitchenware-template");
  return <KitchenwareProductView productId={params.productId} storeSlug={params.slug} />;
}
