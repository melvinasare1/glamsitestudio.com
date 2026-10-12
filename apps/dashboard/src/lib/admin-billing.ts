import { createAdminClient } from "@glamsite/shared/supabase/admin";
import {
  parsePricingTier,
  parseSubscriptionStatus,
  type PricingTier,
  type SubscriptionStatus,
} from "@glamsite/shared/types";
import { PLAN_LABELS } from "@/lib/billing";

export type AdminBillingSeller = {
  id: string;
  businessName: string;
  email: string;
  billingReference: string;
  pricingTier: PricingTier;
  planLabel: string;
  baseFeeCedis: number;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: number | null;
};

function parseIsoMs(value: unknown): number | null {
  if (typeof value !== "string" || !value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export async function loadAdminBillingQueue(): Promise<AdminBillingSeller[]> {
  const supabase = createAdminClient();

  // Keep the queue honest: flip expired trials to overdue before listing.
  await supabase
    .from("sellers")
    .update({ subscription_status: "overdue" })
    .eq("subscription_status", "trialing")
    .lte("trial_ends_at", new Date().toISOString());

  const { data, error } = await supabase
    .from("sellers")
    .select(
      "id, business_name, email, billing_reference, pricing_tier, base_fee_cedis, subscription_status, trial_ends_at"
    )
    .in("subscription_status", ["trialing", "overdue"])
    .order("trial_ends_at", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);

  const sellers: AdminBillingSeller[] = (data ?? []).map((row) => {
    const pricingTier = parsePricingTier(row.pricing_tier);
    return {
      id: String(row.id ?? ""),
      businessName: String(row.business_name ?? "").trim() || "Unnamed store",
      email: String(row.email ?? ""),
      billingReference: String(row.billing_reference ?? "").trim() || "—",
      pricingTier,
      planLabel: PLAN_LABELS[pricingTier],
      baseFeeCedis: Number(row.base_fee_cedis ?? 0),
      subscriptionStatus: parseSubscriptionStatus(row.subscription_status),
      trialEndsAt: parseIsoMs(row.trial_ends_at),
    };
  });

  // Overdue first, then trialing ending soonest.
  sellers.sort((a, b) => {
    if (a.subscriptionStatus !== b.subscriptionStatus) {
      return a.subscriptionStatus === "overdue" ? -1 : 1;
    }
    const aEnd = a.trialEndsAt ?? Number.POSITIVE_INFINITY;
    const bEnd = b.trialEndsAt ?? Number.POSITIVE_INFINITY;
    return aEnd - bEnd;
  });

  return sellers;
}
