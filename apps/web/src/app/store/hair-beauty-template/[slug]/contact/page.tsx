import { HairContactPage } from "@/components/store/hair-beauty-template/contact-page";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function HairBeautySellerContactPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSellerForTemplate(params.slug, "hair-beauty-template");
  return (
    <HairContactPage
      storeSlug={params.slug}
      path={`/store/hair-beauty-template/${params.slug}/contact`}
    />
  );
}
