import { TemplateAProductView } from "../../product-view";

export default async function TemplateAProductPage({
  params,
}: {
  params: { productId: string };
}) {
  return <TemplateAProductView productId={params.productId} />;
}
