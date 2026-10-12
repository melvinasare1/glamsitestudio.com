import { ImportsContactPage } from "@/components/store/imports-template/contact-page";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function ImportsSellerContactPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSellerForTemplate(params.slug, "imports-template");
  return (
    <ImportsContactPage
      storeSlug={params.slug}
      path={`/store/imports-template/${params.slug}/contact`}
    />
  );
}
