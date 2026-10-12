import { SneakerProductView } from "@/app/store/sneaker-template/product-view";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function SneakerSellerProductPage({
  params,
}: {
  params: { slug: string; productId: string };
}) {
  await requireSellerForTemplate(params.slug, "sneaker-template");
  return <SneakerProductView productId={params.productId} storeSlug={params.slug} />;
}
