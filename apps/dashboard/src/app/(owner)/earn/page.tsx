import {
  platformReferralEarningFromRow,
  platformReferralFromRow,
  platformReferralPayoutDetailsFromRow,
} from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { EarnManager } from "./earn-manager";

export const dynamic = "force-dynamic";

export default async function EarnPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();

  const [{ data: referralRows, error: referralError }, { data: earningRows, error: earningError }, { data: payoutRow }] =
    await Promise.all([
      supabase
        .from("platform_referrals")
        .select("*")
        .eq("referrer_business_id", business.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("platform_referral_earnings")
        .select("*")
        .eq("referrer_business_id", business.id)
        .order("year_month", { ascending: false }),
      supabase.from("platform_referral_payout_details").select("*").eq("business_id", business.id).maybeSingle(),
    ]);
  if (referralError) console.error("[earn] referrals load failed", referralError.message);
  if (earningError) console.error("[earn] earnings load failed", earningError.message);

  return (
    <>
      <PageHeader
        title="Earn"
        description="Refer another hair or beauty business to Glam Site Studios. Once they sign up and pay for hosting, you earn 15% of what they pay us, for as long as they stay a customer."
      />
      <PageBody className="max-w-3xl">
        <EarnManager
          currency={business.currency}
          referrals={(referralRows ?? []).map(platformReferralFromRow)}
          earnings={(earningRows ?? []).map(platformReferralEarningFromRow)}
          payoutDetails={payoutRow ? platformReferralPayoutDetailsFromRow(payoutRow) : null}
        />
      </PageBody>
    </>
  );
}
