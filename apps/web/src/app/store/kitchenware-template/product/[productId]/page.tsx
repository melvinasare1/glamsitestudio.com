import { KitchenwareProductView } from "../../product-view";

export default async function KitchenwareTemplateProductPage({
  params,
}: {
  params: { productId: string };
}) {
  return <KitchenwareProductView productId={params.productId} />;
}
