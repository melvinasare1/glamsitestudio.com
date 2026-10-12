import { ImportsHome } from "@/app/store/imports-template/home";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function ImportsSellerHome({ params }: { params: { slug: string } }) {
  await requireSellerForTemplate(params.slug, "imports-template");
  return <ImportsHome storeSlug={params.slug} />;
}
