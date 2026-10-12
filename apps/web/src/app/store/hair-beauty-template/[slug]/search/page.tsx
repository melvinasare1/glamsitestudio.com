import { HairSearchView } from "@/app/store/hair-beauty-template/search-view";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function HairBeautySellerSearchPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSellerForTemplate(params.slug, "hair-beauty-template");
  return <HairSearchView storeSlug={params.slug} />;
}
