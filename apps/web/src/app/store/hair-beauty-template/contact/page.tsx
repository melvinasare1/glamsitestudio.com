import { HairContactPage } from "@/components/store/hair-beauty-template/contact-page";
import { HAIR_BEAUTY_TEMPLATE_BASE } from "@/components/store/hair-beauty-template/demo-catalog";
import { liveStoreSlug } from "@/lib/live-catalog";

export default async function HairBeautyTemplateContactPage() {
  return (
    <HairContactPage
      storeSlug={liveStoreSlug() || undefined}
      path={`${HAIR_BEAUTY_TEMPLATE_BASE}/contact`}
    />
  );
}
