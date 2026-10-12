import { TemplateAProductView } from "@/app/store/template-a/product-view";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function TemplateASellerProductPage({
  params,
}: {
  params: { slug: string; productId: string };
}) {
  await requireSellerForTemplate(params.slug, "template-a");
  return <TemplateAProductView productId={params.productId} storeSlug={params.slug} />;
}
