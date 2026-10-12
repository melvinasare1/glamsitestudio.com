import { HairBeautyHome } from "@/app/store/hair-beauty-template/home";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function HairBeautySellerHome({ params }: { params: { slug: string } }) {
  await requireSellerForTemplate(params.slug, "hair-beauty-template");
  return <HairBeautyHome storeSlug={params.slug} />;
}
