/**
 * Pure hosting-tier / email-quota gating rules. No Supabase dependency —
 * callers (app code, UI copy) read these instead of hardcoding numbers.
 */
import type { EmailNotificationSettings, EmailType, HostingTier } from "./types";

export const EMAIL_QUOTA_BY_TIER: Record<HostingTier, number> = {
  basic: 100,
  popular: 500,
  premium: 1000,
};

/** Monthly hosting price per tier, in cents. Single source of truth for Checkout and marketing copy. */
export const HOSTING_TIER_PRICE_CENTS: Record<HostingTier, number> = {
  basic: 2200,
  popular: 3500,
  premium: 6000,
};

export const HOSTING_TIER_LABEL: Record<HostingTier, string> = {
  basic: "Basic",
  popular: "Popular",
  premium: "Premium",
};

export const HOSTING_TIERS: readonly HostingTier[] = ["basic", "popular", "premium"];

/** One-off done-for-you setup fee, in cents. */
export const DONE_FOR_YOU_PRICE_CENTS = 9900;

/**
 * Our cut of a salon's booking payment, via Stripe Connect's
 * application_fee_amount. Basis points (1% = 100) read from the environment
 * each call, so the rate can change without a redeploy.
 */
export function platformFeeCents(amountCents: number): number {
  const bps = Number(process.env.PLATFORM_FEE_BPS ?? "100");
  return Math.round((amountCents * bps) / 10000);
}

export function monthlyEmailQuota(tier: HostingTier): number {
  return EMAIL_QUOTA_BY_TIER[tier];
}

export function canCustomizeEmailToggles(tier: HostingTier): boolean {
  return tier !== "basic";
}

export function hasCampaignsAccess(tier: HostingTier): boolean {
  return tier === "premium";
}

/** Basic can't customize, so it always sends regardless of stored settings. */
export function isEmailTypeEnabled(
  tier: HostingTier,
  settings: EmailNotificationSettings,
  type: EmailType
): boolean {
  if (!canCustomizeEmailToggles(tier)) return true;
  switch (type) {
    case "clientBookingConfirmation":
      return settings.clientBookingConfirmationEnabled;
    case "ownerBookingConfirmation":
      return settings.ownerBookingConfirmationEnabled;
    case "clientCancellation":
      return settings.clientCancellationEnabled;
    case "ownerCancellation":
      return settings.ownerCancellationEnabled;
  }
}

/** Quota applies equally to all email types — no exemptions. */
export function canSendWithinQuota(usageCount: number, quota: number): boolean {
  return usageCount < quota;
}
