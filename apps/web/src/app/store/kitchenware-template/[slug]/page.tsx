import { KitchenwareHome } from "@/app/store/kitchenware-template/home";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function KitchenwareSellerHome({ params }: { params: { slug: string } }) {
  await requireSellerForTemplate(params.slug, "kitchenware-template");
  return <KitchenwareHome storeSlug={params.slug} />;
}
