import type { SubscriptionStatus } from "@glamsite/shared/types";

export const TRIAL_LENGTH_DAYS = 30;
export const TRIAL_TIME_ZONE = "Africa/Accra";
/** Bumped so a trial reset is visible even if the seller dismissed an older banner. */
export const TRIAL_BANNER_DISMISS_KEY = "glamsite-trial-banner-dismissed-v2";
export const TRIAL_EXPIRY_MODAL_DISMISS_KEY = "glamsite-trial-expiry-modal-dismissed-v2";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type TrialBannerState = {
  expired: boolean;
  daysLeft: number;
};

export function trialEndsAtFromNow(now = Date.now()): number {
  return now + TRIAL_LENGTH_DAYS * MS_PER_DAY;
}

function calendarDateKey(ms: number, timeZone = TRIAL_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

function utcMsFromDateKey(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Whole calendar days from today to the trial end date (Ghana). Negative once that date has passed. */
export function trialCalendarDaysLeft(
  trialEndsAt: number,
  now = Date.now()
): number {
  const end = utcMsFromDateKey(calendarDateKey(trialEndsAt));
  const today = utcMsFromDateKey(calendarDateKey(now));
  return Math.round((end - today) / MS_PER_DAY);
}

/**
 * Banner copy for an active trial countdown. Null when there is no trial window,
 * or when billing is already active/overdue (those use subscription messaging).
 */
export function trialBannerState(
  trialEndsAt: number | null | undefined,
  subscriptionStatus: SubscriptionStatus | null | undefined,
  now = Date.now()
): TrialBannerState | null {
  if (subscriptionStatus === "active") return null;
  if (subscriptionStatus === "overdue") return { expired: true, daysLeft: 0 };

  if (trialEndsAt == null || !Number.isFinite(trialEndsAt) || trialEndsAt <= 0) {
    return null;
  }
  const daysUntilEndDate = trialCalendarDaysLeft(trialEndsAt, now);
  if (daysUntilEndDate < 0) return { expired: true, daysLeft: 0 };
  return { expired: false, daysLeft: Math.max(daysUntilEndDate, 1) };
}

export function trialBannerMessage(trial: TrialBannerState): string {
  if (trial.expired) return "Your 30-day free trial has ended.";
  const unit = trial.daysLeft === 1 ? "day" : "days";
  return `${trial.daysLeft} ${unit} left in your 30-day free trial.`;
}

/**
 * Show the pay-now modal only when billing is overdue.
 * Storefront `status` is unrelated — use subscription_status.
 */
export function trialPaymentOverdue(
  seller:
    | {
        trialEndsAt?: number;
        subscriptionStatus?: SubscriptionStatus;
      }
    | null
    | undefined
): boolean {
  if (!seller) return false;
  return seller.subscriptionStatus === "overdue";
}

/** Ghana calendar month label for a payment confirmation, e.g. "September 2026". */
export function billingPeriodLabel(at = Date.now()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TRIAL_TIME_ZONE,
    month: "long",
    year: "numeric",
  }).format(new Date(at));
}
