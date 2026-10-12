import { ImportsSearchView } from "@/app/store/imports-template/search-view";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function ImportsSellerSearchPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSellerForTemplate(params.slug, "imports-template");
  return <ImportsSearchView storeSlug={params.slug} />;
}
