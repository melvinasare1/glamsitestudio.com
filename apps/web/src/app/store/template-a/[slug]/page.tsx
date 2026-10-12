import { TemplateAHome } from "@/app/store/template-a/home";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function TemplateASellerHome({ params }: { params: { slug: string } }) {
  await requireSellerForTemplate(params.slug, "template-a");
  return <TemplateAHome storeSlug={params.slug} />;
}
