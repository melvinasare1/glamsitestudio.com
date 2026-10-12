import { RideProductPage } from "@/components/store/motorbike-template/product-page";
import { storefrontBase } from "@/lib/store-path";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function MotorbikeTemplateSlugProductPage({
  params,
}: {
  params: { slug: string; productId: string };
}) {
  await requireSellerForTemplate(params.slug, "motorbike-template");
  return (
    <RideProductPage
      productId={params.productId}
      storeSlug={params.slug}
      pathBase={storefrontBase("motorbike-template", params.slug)}
    />
  );
}
