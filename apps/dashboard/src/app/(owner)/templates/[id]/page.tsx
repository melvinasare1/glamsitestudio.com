import { notFound } from "next/navigation";
import { getWebUrl } from "@glamsite/shared/supabase/env";
import { isTemplateId } from "@glamsite/shared/templates";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { TemplatePreviewDetailsScreen } from "./template-preview-details-screen";

export const dynamic = "force-dynamic";

export default async function TemplateDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isTemplateId(id)) notFound();

  const { business } = await requireBusiness();
  return (
    <>
      <PageHeader title="Templates" />
      <PageBody className="max-w-6xl">
        <TemplatePreviewDetailsScreen templateId={id} currentTemplateId={business.templateId} demoBaseUrl={getWebUrl()} />
      </PageBody>
    </>
  );
}
