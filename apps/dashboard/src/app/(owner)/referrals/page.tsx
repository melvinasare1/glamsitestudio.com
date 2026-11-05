import { clientReferralFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { ReferralsManager } from "./referrals-manager";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_referrals")
    .select("*, referrer:referrer_client_id(name, email), referred:referred_client_id(name, email)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  if (error) console.error("[referrals] load failed", error.message);

  return (
    <>
      <PageHeader
        title="Referrals"
        description="Every client has their own referral link. When someone they refer completes their first appointment, they earn a one-time discount code by email."
      />
      <PageBody className="max-w-3xl">
        <ReferralsManager
          currency={business.currency}
          rewardCents={business.referralRewardCents}
          referrals={(data ?? []).map(clientReferralFromRow)}
        />
      </PageBody>
    </>
  );
}
