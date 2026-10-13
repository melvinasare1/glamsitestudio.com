import { openingHoursFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { HoursEditor } from "./hours-editor";

export const dynamic = "force-dynamic";

export default async function HoursPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();
  const { data } = await supabase.from("opening_hours").select("*").eq("business_id", business.id);

  return (
    <>
      <PageHeader title="Opening hours" description={`Times are in your local time (${business.timezone}).`} />
      <PageBody>
        <HoursEditor hours={(data ?? []).map(openingHoursFromRow)} />
      </PageBody>
    </>
  );
}
