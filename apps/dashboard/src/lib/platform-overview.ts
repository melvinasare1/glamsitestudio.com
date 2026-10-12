import { createAdminClient } from "@glamsite/shared/supabase/admin";
import {
  parsePricingTier,
  parseSellerStatus,
  parseStorefrontTemplate,
  parseSubscriptionStatus,
  STOREFRONT_TEMPLATES,
  type PricingTier,
  type SellerStatus,
  type StorefrontTemplate,
  type SubscriptionStatus,
} from "@glamsite/shared/types";
import { PLAN_LABELS } from "@/lib/billing";
import { TRIAL_LENGTH_DAYS } from "@/lib/trial";
import { templateLabel } from "@/lib/storefront-templates";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type SignupWindowDays = 30 | 90;

export type PlatformActivity = {
  at: number;
  title: string;
  detail: string;
};

export type PlatformOverview = {
  activeBusinesses: number;
  onTrial: number;
  trialExpiredUnpaid: number;
  pendingReview: number;
  mrrCedis: number;
  tiers: Array<{
    id: PricingTier;
    label: string;
    count: number;
    percent: number | null;
    revenueCedis: number;
  }>;
  templates: Array<{
    id: StorefrontTemplate;
    label: string;
    count: number;
  }>;
  conversion: {
    ended: number;
    converted: number;
    notConverted: number;
    rate: number | null;
    dataGap: string | null;
  };
  signupSeries: Array<{ date: string; signups: number }>;
  signupWindowDays: SignupWindowDays;
  activity: PlatformActivity[];
  totalSellers: number;
};

type SellerSnapshot = {
  id: string;
  businessName: string;
  storeSlug: string;
  email: string;
  template: StorefrontTemplate;
  pricingTier: PricingTier;
  baseFeeCedis: number;
  status: SellerStatus;
  subscriptionStatus: SubscriptionStatus;
  createdAt: number;
  trialEndsAt: number | null;
  verificationSubmittedAt: number | null;
  lastPaymentConfirmedAt: number | null;
};

function parseIsoMs(value: unknown): number | null {
  if (typeof value !== "string" || !value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function percent(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

function isPaying(seller: SellerSnapshot): boolean {
  return seller.subscriptionStatus === "active";
}

function formatDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function computePlatformOverview(
  sellers: SellerSnapshot[],
  now: number,
  signupWindowDays: SignupWindowDays
): PlatformOverview {
  const activeBusinesses = sellers.filter((seller) => seller.status === "active").length;
  const onTrial = sellers.filter((seller) => seller.subscriptionStatus === "trialing").length;
  const trialExpiredUnpaid = sellers.filter(
    (seller) => seller.subscriptionStatus === "overdue"
  ).length;
  const pendingReview = sellers.filter(
    (seller) => seller.status === "onboarding" && seller.verificationSubmittedAt != null
  ).length;

  const paying = sellers.filter((seller) => isPaying(seller));
  const mrrCedis = paying.reduce(
    (sum, seller) => sum + (Number.isFinite(seller.baseFeeCedis) ? seller.baseFeeCedis : 0),
    0
  );

  const totalSellers = sellers.length;
  const tiers: PlatformOverview["tiers"] = (["website_admin", "fulfilment"] as const).map((id) => {
    const members = sellers.filter((seller) => seller.pricingTier === id);
    const revenueCedis = members
      .filter((seller) => isPaying(seller))
      .reduce((sum, seller) => sum + seller.baseFeeCedis, 0);
    return {
      id,
      label: PLAN_LABELS[id],
      count: members.length,
      percent: percent(members.length, totalSellers),
      revenueCedis,
    };
  });

  const templates: PlatformOverview["templates"] = STOREFRONT_TEMPLATES.map((id) => ({
    id,
    label: templateLabel(id),
    count: sellers.filter((seller) => seller.status === "active" && seller.template === id).length,
  }));

  // Trials that have ended for billing purposes: overdue or paid after a trial window.
  const endedTrials = sellers.filter(
    (seller) =>
      seller.subscriptionStatus === "overdue" ||
      (seller.subscriptionStatus === "active" &&
        (seller.trialEndsAt == null || seller.trialEndsAt <= now))
  );
  const converted = endedTrials.filter((seller) => seller.subscriptionStatus === "active").length;
  const notConverted = endedTrials.length - converted;

  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const signupSeries: Array<{ date: string; signups: number }> = [];
  for (let offset = signupWindowDays - 1; offset >= 0; offset -= 1) {
    const day = new Date(todayUtc.getTime() - offset * MS_PER_DAY);
    signupSeries.push({ date: formatDay(day.getTime()), signups: 0 });
  }
  const byDay = new Map(signupSeries.map((point) => [point.date, point]));
  for (const seller of sellers) {
    if (seller.createdAt < todayUtc.getTime() - (signupWindowDays - 1) * MS_PER_DAY || seller.createdAt > now)
      continue;
    const key = formatDay(seller.createdAt);
    const point = byDay.get(key);
    if (point) point.signups += 1;
  }

  const activity: PlatformActivity[] = [];
  for (const seller of sellers) {
    const name = seller.businessName.trim() || seller.storeSlug || "Unnamed store";
    activity.push({
      at: seller.createdAt,
      title: "Signed up",
      detail: name,
    });
    if (seller.verificationSubmittedAt != null) {
      activity.push({
        at: seller.verificationSubmittedAt,
        title: "Submitted for review",
        detail: name,
      });
    }
    if (seller.trialEndsAt != null) {
      const startedAt = seller.trialEndsAt - TRIAL_LENGTH_DAYS * MS_PER_DAY;
      activity.push({
        at: Math.max(startedAt, seller.createdAt),
        title: "Trial started",
        detail: name,
      });
    }
    if (seller.lastPaymentConfirmedAt != null) {
      activity.push({
        at: seller.lastPaymentConfirmedAt,
        title: "Subscription payment confirmed",
        detail: name,
      });
    }
  }
  activity.sort((a, b) => b.at - a.at);

  return {
    activeBusinesses,
    onTrial,
    trialExpiredUnpaid,
    pendingReview,
    mrrCedis,
    tiers,
    templates,
    conversion: {
      ended: endedTrials.length,
      converted,
      notConverted,
      rate: percent(converted, endedTrials.length),
      dataGap: null,
    },
    signupSeries,
    signupWindowDays,
    activity: activity.slice(0, 20),
    totalSellers,
  };
}

export async function loadPlatformOverview(
  signupWindowDays: SignupWindowDays
): Promise<PlatformOverview> {
  const supabase = createAdminClient();

  await supabase
    .from("sellers")
    .update({ subscription_status: "overdue" })
    .eq("subscription_status", "trialing")
    .lte("trial_ends_at", new Date().toISOString());

  const { data, error } = await supabase
    .from("sellers")
    .select(
      "id, business_name, store_slug, email, template, pricing_tier, base_fee_cedis, status, subscription_status, created_at, trial_ends_at, verification_submitted_at, last_payment_confirmed_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const sellers: SellerSnapshot[] = (data ?? []).map((row) => ({
    id: String(row.id ?? ""),
    businessName: String(row.business_name ?? ""),
    storeSlug: String(row.store_slug ?? ""),
    email: String(row.email ?? ""),
    template: parseStorefrontTemplate(row.template),
    pricingTier: parsePricingTier(row.pricing_tier),
    baseFeeCedis: Number(row.base_fee_cedis ?? 0),
    status: parseSellerStatus(row.status),
    subscriptionStatus: parseSubscriptionStatus(row.subscription_status),
    createdAt: parseIsoMs(row.created_at) ?? 0,
    trialEndsAt: parseIsoMs(row.trial_ends_at),
    verificationSubmittedAt: parseIsoMs(row.verification_submitted_at),
    lastPaymentConfirmedAt: parseIsoMs(row.last_payment_confirmed_at),
  }));

  return computePlatformOverview(sellers, Date.now(), signupWindowDays);
}
