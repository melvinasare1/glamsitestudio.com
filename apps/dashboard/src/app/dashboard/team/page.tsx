import { serviceFromRow, staffFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { TeamManager } from "./team-manager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();
  const [staff, services] = await Promise.all([
    supabase.from("staff").select("*, staff_services(service_id)").eq("business_id", business.id).order("position"),
    supabase.from("services").select("*").eq("business_id", business.id).order("position"),
  ]);

  return (
    <>
      <PageHeader title="Team" description="The people clients will see on your site, and later book with." />
      <PageBody>
        <TeamManager
          businessId={business.id}
          staff={(staff.data ?? []).map(staffFromRow)}
          services={(services.data ?? []).map(serviceFromRow)}
        />
      </PageBody>
    </>
  );
}
