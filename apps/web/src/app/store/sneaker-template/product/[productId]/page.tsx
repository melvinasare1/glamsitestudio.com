import { SneakerProductView } from "../../product-view";

export default async function SneakerProductPage({
  params,
}: {
  params: { productId: string };
}) {
  return <SneakerProductView productId={params.productId} />;
}
