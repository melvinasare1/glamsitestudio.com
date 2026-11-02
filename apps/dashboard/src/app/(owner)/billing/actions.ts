"use server";

import { revalidatePath } from "next/cache";
import { canCustomizeEmailToggles, HOSTING_TIER_PRICE_CENTS } from "@glamsite/shared/billing";
import { billingFromRow } from "@glamsite/shared/mappers";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { getDashboardUrl } from "@glamsite/shared/supabase/env";
import { getOrCreateFirstMonthCoupon, getStripe } from "@glamsite/shared/stripe";
import type { EmailNotificationSettings } from "@glamsite/shared/types";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";

const done = (): ActionResult => {
  revalidatePath("/billing");
  return { ok: true };
};

export type EmailNotificationSettingsInput = Omit<EmailNotificationSettings, "businessId">;

export async function saveEmailNotificationSettings(input: EmailNotificationSettingsInput): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const { data: billingRow } = await ctx.supabase
    .from("business_billing")
    .select("*")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  const hostingTier = billingRow ? billingFromRow(billingRow).hostingTier : "basic";
  if (!canCustomizeEmailToggles(hostingTier)) {
    return fail("Upgrade your hosting plan to choose which emails are sent.");
  }

  const { error } = await ctx.supabase.from("email_notification_settings").upsert(
    {
      business_id: ctx.business.id,
      client_booking_confirmation_enabled: input.clientBookingConfirmationEnabled,
      owner_booking_confirmation_enabled: input.ownerBookingConfirmationEnabled,
      client_cancellation_enabled: input.clientCancellationEnabled,
      owner_cancellation_enabled: input.ownerCancellationEnabled,
    },
    { onConflict: "business_id" }
  );
  if (error) return dbError("save email notification settings", error);
  return done();
}

export type PortalResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * The only thing gated on payment: launching the site (making it public).
 * Everything else in the dashboard is open from sign-up. $1 for the first
 * month of Basic hosting — owners pick a bigger tier later, from this same
 * page, once they're live.
 */
export async function startLaunchCheckout(): Promise<PortalResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const { data: billingRow } = await ctx.supabase
    .from("business_billing")
    .select("subscription_status")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  if (billingRow?.subscription_status === "active" || billingRow?.subscription_status === "trialing") {
    return { ok: false, error: "You're already live." };
  }
  if (!ctx.business.email) return { ok: false, error: "Add a contact email in Business details first." };

  const hostingPriceCents = HOSTING_TIER_PRICE_CENTS.basic;

  try {
    const stripe = getStripe();
    const coupon = await getOrCreateFirstMonthCoupon(stripe, hostingPriceCents);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: ctx.business.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Glam Site Studios hosting — basic" },
            unit_amount: hostingPriceCents,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      discounts: [{ coupon: coupon.id }],
      success_url: `${getDashboardUrl()}/?launched=1`,
      cancel_url: `${getDashboardUrl()}/billing`,
      metadata: { businessId: ctx.business.id },
      subscription_data: { metadata: { businessId: ctx.business.id } },
    });
    if (!session.url) return { ok: false, error: "Couldn't start checkout. Try again." };
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[billing] launch checkout failed", error);
    return { ok: false, error: "Couldn't start checkout. Try again." };
  }
}

export async function createBillingPortalSession(): Promise<PortalResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const { data: billingRow } = await ctx.supabase
    .from("business_billing")
    .select("stripe_customer_id")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  const customerId = billingRow?.stripe_customer_id;
  if (!customerId) return { ok: false, error: "No billing account yet. This appears once your plan is active." };

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getDashboardUrl()}/billing`,
    });
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[billing] portal session failed", error);
    return { ok: false, error: "Couldn't open billing. Try again." };
  }
}

/**
 * Stripe Connect Express onboarding for a salon's own booking payments
 * (rule 9: their money, never ours). Owners only have a `select` RLS policy
 * on `business_billing`, so saving the account id needs the admin client.
 */
export async function startConnectOnboarding(): Promise<PortalResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const { data: billingRow } = await ctx.supabase
    .from("business_billing")
    .select("stripe_connect_account_id")
    .eq("business_id", ctx.business.id)
    .maybeSingle();

  const admin = createAdminClient();
  let accountId = billingRow?.stripe_connect_account_id as string | null | undefined;

  try {
    const stripe = getStripe();
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: ctx.business.email || undefined,
        business_profile: { name: ctx.business.name },
      });
      accountId = account.id;
      const { error } = await admin
        .from("business_billing")
        .update({ stripe_connect_account_id: accountId })
        .eq("business_id", ctx.business.id);
      if (error) {
        console.error("[dashboard] save Stripe Connect account", error);
        return { ok: false, error: "Something went wrong saving that. Please try again." };
      }
    }

    const returnUrl = `${getDashboardUrl()}/billing`;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: returnUrl,
      return_url: returnUrl,
    });
    return { ok: true, url: accountLink.url };
  } catch (error) {
    console.error("[billing] Connect onboarding failed", error);
    return { ok: false, error: "Couldn't start Stripe onboarding. Try again." };
  }
}
