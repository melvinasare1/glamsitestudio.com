import { TemplateASearchView } from "@/app/store/template-a/search-view";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function TemplateASellerSearchPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSellerForTemplate(params.slug, "template-a");
  return <TemplateASearchView storeSlug={params.slug} />;
}
