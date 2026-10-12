import { SneakerSearchView } from "@/app/store/sneaker-template/search-view";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function SneakerSellerSearchPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSellerForTemplate(params.slug, "sneaker-template");
  return <SneakerSearchView storeSlug={params.slug} />;
}
