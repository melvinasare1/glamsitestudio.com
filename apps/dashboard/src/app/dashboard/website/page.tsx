import { getWebUrl } from "@glamsite/shared/supabase/env";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { WebsiteEditor } from "./website-editor";

export const dynamic = "force-dynamic";

export default async function WebsitePage() {
  const { business } = await requireBusiness();
  return (
    <>
      <PageHeader
        title="Website"
        description="Edit each section of your site. Changes show on your live site within a minute of saving."
      />
      <PageBody>
        <WebsiteEditor business={business} demoBaseUrl={getWebUrl()} />
      </PageBody>
    </>
  );
}
