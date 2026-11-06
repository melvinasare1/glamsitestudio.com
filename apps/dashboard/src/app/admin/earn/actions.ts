"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import type { PlatformReferralStatus } from "@glamsite/shared/types";
import { fail, type ActionResult } from "@/lib/business";
import { requireAdmin } from "@/lib/admin";

const STATUSES: PlatformReferralStatus[] = ["submitted", "contacted", "signed_up", "active", "lost"];

const done = (): ActionResult => {
  revalidatePath("/admin/earn");
  return { ok: true };
};

/** Staff-only: move a referral through its pipeline, link it to the business once they sign up, and leave internal notes. */
export async function updatePlatformReferral(input: {
  id: string;
  status: PlatformReferralStatus;
  referredBusinessId: string;
  staffNotes: string;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!STATUSES.includes(input.status)) return fail("Invalid status.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("platform_referrals")
    .update({
      status: input.status,
      referred_business_id: input.referredBusinessId.trim() || null,
      staff_notes: input.staffNotes.trim(),
    })
    .eq("id", input.id);
  if (error) {
    console.error("[admin/earn] update referral failed", error.message);
    return fail("Something went wrong saving that. Please try again.");
  }
  return done();
}

/** Staff-only: record one month's commission on a referral, from the referred business's real hosting spend. */
export async function recordPlatformReferralEarning(input: {
  referralId: string;
  referrerBusinessId: string;
  yearMonth: string;
  grossCents: number;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!/^\d{4}-\d{2}$/.test(input.yearMonth)) return fail("Enter a month as YYYY-MM.");
  if (!Number.isFinite(input.grossCents) || input.grossCents < 0) return fail("Enter a valid amount.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("platform_referral_earnings").upsert(
    {
      referral_id: input.referralId,
      referrer_business_id: input.referrerBusinessId,
      year_month: input.yearMonth,
      gross_cents: Math.round(input.grossCents),
    },
    { onConflict: "referral_id,year_month" }
  );
  if (error) {
    console.error("[admin/earn] record earning failed", error.message);
    return fail("Something went wrong saving that. Please try again.");
  }
  return done();
}
