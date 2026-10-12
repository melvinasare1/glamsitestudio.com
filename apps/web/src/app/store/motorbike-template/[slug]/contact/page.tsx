import { RideContactPage } from "@/components/store/motorbike-template/contact-page";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function MotorbikeTemplateSellerContactPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSellerForTemplate(params.slug, "motorbike-template");
  return (
    <RideContactPage
      storeSlug={params.slug}
      path={`/store/motorbike-template/${params.slug}/contact`}
    />
  );
}
