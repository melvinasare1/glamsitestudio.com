import { getWebUrl } from "@glamsite/shared/supabase/env";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { TemplateGallery } from "./template-gallery";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const { business } = await requireBusiness();
  return (
    <>
      <PageHeader
        title="Templates"
        description="Your design. Switch any time: your text, photos, services and team stay as they are."
      />
      <PageBody className="max-w-6xl">
        <TemplateGallery templateId={business.templateId} demoBaseUrl={getWebUrl()} />
      </PageBody>
    </>
  );
}
