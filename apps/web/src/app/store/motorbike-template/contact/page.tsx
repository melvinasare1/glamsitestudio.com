import { RideContactPage } from "@/components/store/motorbike-template/contact-page";
import { rideLiveStoreSlug } from "@/components/store/motorbike-template/catalog";
import { RIDE_TEMPLATE_BASE } from "@/components/store/motorbike-template/demo-catalog";

export default async function MotorbikeTemplateContactPage() {
  return (
    <RideContactPage
      storeSlug={rideLiveStoreSlug()}
      path={`${RIDE_TEMPLATE_BASE}/contact`}
    />
  );
}
