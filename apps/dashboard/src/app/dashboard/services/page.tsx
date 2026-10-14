import { categoryFromRow, serviceFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { ServicesManager } from "./services-manager";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();
  const [categories, services] = await Promise.all([
    supabase.from("service_categories").select("*").eq("business_id", business.id).order("position"),
    supabase.from("services").select("*").eq("business_id", business.id).order("position"),
  ]);

  return (
    <>
      <PageHeader
        title="Services"
        description="Your price list. These show on your site and, once online booking is on, they're what clients book."
      />
      <PageBody>
        <ServicesManager
          categories={(categories.data ?? []).map(categoryFromRow)}
          services={(services.data ?? []).map(serviceFromRow)}
          currency={business.currency}
        />
      </PageBody>
    </>
  );
}
