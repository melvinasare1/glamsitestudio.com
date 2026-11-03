import { discountCodeFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { DiscountsManager } from "./discounts-manager";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  if (error) console.error("[discounts] load failed", error.message);

  return (
    <>
      <PageHeader
        title="Discounts"
        description="Codes clients can enter at checkout. Only applies when online payment is on."
      />
      <PageBody className="max-w-3xl">
        <DiscountsManager currency={business.currency} codes={(data ?? []).map(discountCodeFromRow)} />
      </PageBody>
    </>
  );
}
