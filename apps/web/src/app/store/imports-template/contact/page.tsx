import { ImportsContactPage } from "@/components/store/imports-template/contact-page";
import { liveStoreSlug } from "@/lib/live-catalog";
import { IMPORTS_TEMPLATE_BASE } from "@/components/store/imports-template/demo-catalog";

export default async function ImportsTemplateContactPage() {
  return (
    <ImportsContactPage storeSlug={liveStoreSlug() || undefined} path={`${IMPORTS_TEMPLATE_BASE}/contact`} />
  );
}
