import { SneakerHome } from "@/app/store/sneaker-template/home";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function SneakerSellerHome({ params }: { params: { slug: string } }) {
  await requireSellerForTemplate(params.slug, "sneaker-template");
  return <SneakerHome storeSlug={params.slug} />;
}
