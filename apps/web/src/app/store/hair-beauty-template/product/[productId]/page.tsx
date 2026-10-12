import { HairProductView } from "../../product-view";

export default async function HairBeautyTemplateProductPage({
  params,
}: {
  params: { productId: string };
}) {
  return <HairProductView productId={params.productId} />;
}
