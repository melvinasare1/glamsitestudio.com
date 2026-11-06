import { businessFromRow, platformReferralEarningFromRow, platformReferralFromRow } from "@glamsite/shared/mappers";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { PageBody, PageHeader } from "@/components/page";
import { EarnAdminManager } from "./earn-admin-manager";

export const dynamic = "force-dynamic";

/** Staff-only pipeline for the "Earn" business-to-business referral program (gated by requireAdmin() in admin/layout.tsx). */
export default async function AdminEarnPage() {
  const supabase = createAdminClient();

  const [{ data: referralRows, error: referralError }, { data: earningRows, error: earningError }, { data: businessRows }] =
    await Promise.all([
      supabase.from("platform_referrals").select("*").order("created_at", { ascending: false }),
      supabase.from("platform_referral_earnings").select("*").order("year_month", { ascending: false }),
      supabase.from("businesses").select("id, name, slug").order("name"),
    ]);
  if (referralError) console.error("[admin/earn] referrals load failed", referralError.message);
  if (earningError) console.error("[admin/earn] earnings load failed", earningError.message);

  const businesses = (businessRows ?? []).map(businessFromRow);
  const referrerNameById = new Map(businesses.map((business) => [business.id, business.name || business.slug]));

  return (
    <>
      <PageHeader
        title="Earn referrals"
        description="Business-to-business referrals: move each one through its pipeline and record monthly commission once a referred business is paying for hosting."
      />
      <PageBody className="max-w-6xl">
        <EarnAdminManager
          referrals={(referralRows ?? []).map(platformReferralFromRow)}
          earnings={(earningRows ?? []).map(platformReferralEarningFromRow)}
          businesses={businesses.map((b) => ({ id: b.id, name: b.name || b.slug }))}
          referrerNameById={Object.fromEntries(referrerNameById)}
        />
      </PageBody>
    </>
  );
}
