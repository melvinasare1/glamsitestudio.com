import { ImportsProductView } from "../../product-view";

export default async function ImportsTemplateProductPage({
  params,
}: {
  params: { productId: string };
}) {
  return <ImportsProductView productId={params.productId} />;
}
