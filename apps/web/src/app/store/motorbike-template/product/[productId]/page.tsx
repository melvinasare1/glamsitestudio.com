import { RideProductPage } from "@/components/store/motorbike-template/product-page";
import { RIDE_TEMPLATE_BASE } from "@/components/store/motorbike-template/demo-catalog";

export default async function MotorbikeTemplateProductPage({
  params,
}: {
  params: { productId: string };
}) {
  return (
    <RideProductPage
      productId={params.productId}
      storeSlug="motorbike-template"
      pathBase={RIDE_TEMPLATE_BASE}
    />
  );
}
