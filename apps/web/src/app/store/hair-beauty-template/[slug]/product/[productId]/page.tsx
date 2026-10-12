import { HairProductView } from "@/app/store/hair-beauty-template/product-view";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function HairBeautySellerProductPage({
  params,
}: {
  params: { slug: string; productId: string };
}) {
  await requireSellerForTemplate(params.slug, "hair-beauty-template");
  return <HairProductView productId={params.productId} storeSlug={params.slug} />;
}
