import { MotorbikeHome } from "@/app/store/motorbike-template/home";
import { requireSellerForTemplate } from "@/lib/storefront-resolve";

export default async function MotorbikeTemplateSellerHome({
  params,
}: {
  params: { slug: string };
}) {
  await requireSellerForTemplate(params.slug, "motorbike-template");
  return <MotorbikeHome storeSlug={params.slug} />;
}
