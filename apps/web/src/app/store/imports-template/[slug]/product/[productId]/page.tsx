import { ImportsProductView } from "@/app/store/imports-template/product-view";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function ImportsSellerProductPage({
  params,
}: {
  params: { slug: string; productId: string };
}) {
  await requireSellerForTemplate(params.slug, "imports-template");
  return <ImportsProductView productId={params.productId} storeSlug={params.slug} />;
}
