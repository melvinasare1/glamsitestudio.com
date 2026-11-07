"use server";

import { revalidatePath } from "next/cache";
import {
  BOOKING_ADDON_PRICE_CENTS,
  canCustomizeEmailToggles,
  HOSTING_TIER_LABEL,
  HOSTING_TIER_PRICE_CENTS,
  HOSTING_TIERS,
} from "@glamsite/shared/billing";
import { billingFromRow } from "@glamsite/shared/mappers";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { getDashboardUrl } from "@glamsite/shared/supabase/env";
import {
  getOrCreateBookingAddonProduct,
  getOrCreateFirstMonthCoupon,
  getOrCreateHostingProduct,
  getStripe,
  stripeErrorMessage,
} from "@glamsite/shared/stripe";
import type { EmailNotificationSettings, HostingTier } from "@glamsite/shared/types";
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
    .select("subscription_status, hosting_tier")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  if (billingRow?.subscription_status === "active" || billingRow?.subscription_status === "trialing") {
    return { ok: false, error: "You're already live." };
  }
  if (!ctx.business.email) return { ok: false, error: "Add a contact email in Business details first." };

  const tier: HostingTier = HOSTING_TIERS.includes(billingRow?.hosting_tier as HostingTier)
    ? (billingRow!.hosting_tier as HostingTier)
    : "basic";
  const hostingPriceCents = HOSTING_TIER_PRICE_CENTS[tier];

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
            product_data: { name: `Glam Site Studios hosting: ${HOSTING_TIER_LABEL[tier]}` },
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

/**
 * Owner-initiated plan change. Before launch this just updates the tier
 * that startLaunchCheckout will use; once live, it updates the real Stripe
 * subscription's price (prorated) so the next invoice reflects it. Owners
 * only have `select` on business_billing (see startConnectOnboarding), so
 * the write goes through the admin client.
 */
export async function changeHostingTier(tier: HostingTier): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  if (!HOSTING_TIERS.includes(tier)) return fail("Choose a valid plan.");

  const { data: billingRow } = await ctx.supabase
    .from("business_billing")
    .select("*")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  if (!billingRow) return fail("Nothing to change yet.");
  const billing = billingFromRow(billingRow);
  if (billing.hostingTier === tier) return fail("You're already on this plan.");

  const launched = billing.subscriptionStatus === "active" || billing.subscriptionStatus === "trialing";
  if (launched) {
    if (!billing.stripeSubscriptionId) return dbError("change hosting tier", null);
    try {
      const stripe = getStripe();
      const [subscription, product] = await Promise.all([
        stripe.subscriptions.retrieve(billing.stripeSubscriptionId),
        getOrCreateHostingProduct(stripe),
      ]);
      const item = subscription.items.data[0];
      if (!item) return fail("Couldn't change your plan. Try again.");
      await stripe.subscriptions.update(billing.stripeSubscriptionId, {
        items: [
          {
            id: item.id,
            price_data: {
              currency: "usd",
              product: product.id,
              unit_amount: HOSTING_TIER_PRICE_CENTS[tier],
              recurring: { interval: "month" },
            },
          },
        ],
        proration_behavior: "create_prorations",
      });
    } catch (error) {
      console.error("[billing] change hosting tier failed", error);
      return fail("Couldn't change your plan. Try again.");
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from("business_billing").update({ hosting_tier: tier }).eq("business_id", ctx.business.id);
  if (error) return dbError("change hosting tier", error);

  revalidatePath("/billing");
  return { ok: true };
}

/**
 * Turns on the paid booking add-on (docs/follow-ups.md: booking used to be
 * free for any owner; this is what gates it, via a second item on the
 * existing hosting subscription). Requires an active subscription — booking
 * (apps/dashboard/src/app/(owner)/booking/actions.ts saveBooking) refuses
 * "glamsite" mode until business_billing.booking_addon is true.
 */
export async function enableBookingAddon(): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const { data: billingRow } = await ctx.supabase
    .from("business_billing")
    .select("*")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  if (!billingRow) return fail("Launch your site first, then add booking.");
  const billing = billingFromRow(billingRow);
  if (billing.bookingAddon) return done();

  const launched = billing.subscriptionStatus === "active" || billing.subscriptionStatus === "trialing";
  if (!launched || !billing.stripeSubscriptionId) return fail("Launch your site first, then add booking.");

  try {
    const stripe = getStripe();
    const product = await getOrCreateBookingAddonProduct(stripe);
    const item = await stripe.subscriptionItems.create({
      subscription: billing.stripeSubscriptionId,
      price_data: {
        currency: "usd",
        product: product.id,
        unit_amount: BOOKING_ADDON_PRICE_CENTS,
        recurring: { interval: "month" },
      },
      proration_behavior: "create_prorations",
    });

    const admin = createAdminClient();
    const { error } = await admin
      .from("business_billing")
      .update({ booking_addon: true, stripe_booking_addon_item_id: item.id })
      .eq("business_id", ctx.business.id);
    if (error) return dbError("enable booking add-on", error);
  } catch (error) {
    console.error("[billing] enable booking add-on failed", error);
    return { ok: false, error: stripeErrorMessage(error, "Couldn't add booking. Try again.") };
  }

  revalidatePath("/billing");
  revalidatePath("/booking");
  return { ok: true };
}

/** Removes the booking add-on's subscription item; saveBooking already moves booking_mode off "glamsite" itself. */
export async function disableBookingAddon(): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const { data: billingRow } = await ctx.supabase
    .from("business_billing")
    .select("*")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  if (!billingRow) return fail("Nothing to change.");
  const billing = billingFromRow(billingRow);
  if (!billing.bookingAddon) return done();

  try {
    if (billing.stripeBookingAddonItemId) {
      await getStripe().subscriptionItems.del(billing.stripeBookingAddonItemId, {
        proration_behavior: "create_prorations",
      });
    }
  } catch (error) {
    console.error("[billing] disable booking add-on failed", error);
    return { ok: false, error: stripeErrorMessage(error, "Couldn't remove booking. Try again.") };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("business_billing")
    .update({ booking_addon: false, stripe_booking_addon_item_id: null })
    .eq("business_id", ctx.business.id);
  if (error) return dbError("disable booking add-on", error);

  revalidatePath("/billing");
  revalidatePath("/booking");
  return { ok: true };
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

  // createBooking's Checkout session (apps/web/src/lib/booking.ts) is a
  // destination charge with no `on_behalf_of` -- we stay the merchant of
  // record and just transfer the salon's cut out. Per Stripe's own v2
  // Accounts docs that calls for the Recipient configuration, not Merchant
  // (Merchant is for when the connected account itself is the merchant of
  // record, e.g. direct charges). Request both: Merchant/card_payments is
  // what Express's own dashboard needs to show the owner their payment
  // activity, Recipient/stripe_balance.stripe_transfers is what actually
  // lets the transfer into their balance succeed -- without it Checkout
  // fails with "insufficient_capabilities_for_transfer".
  const recipientCapability = {
    configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } } },
  } as const;

  try {
    const stripe = getStripe();
    if (!accountId) {
      // Accounts v1's `type: "express"` is no longer accepted on this platform
      // (it defaulted to the platform as losses collector, which Stripe now
      // rejects). Accounts v2 replaces `type` with explicit `dashboard` +
      // `defaults.responsibilities`; Express Dashboard + Stripe as losses
      // collector ("Managed Risk") is still in preview, hence the pinned
      // Stripe-Version override on just this call. See
      // https://docs.stripe.com/connect/risk-management/connected-accounts-with-managed-risk
      const account = await stripe.v2.core.accounts.create(
        {
          contact_email: ctx.business.email || undefined,
          display_name: ctx.business.name,
          dashboard: "express",
          identity: { country: ctx.business.address.country.toLowerCase() },
          configuration: {
            merchant: {
              capabilities: { card_payments: { requested: true } },
            },
            ...recipientCapability.configuration,
          },
          defaults: {
            responsibilities: { fees_collector: "stripe", losses_collector: "stripe" },
          },
        },
        { apiVersion: "2026-10-28.preview" }
      );
      accountId = account.id;
      const { error } = await admin
        .from("business_billing")
        .update({ stripe_connect_account_id: accountId })
        .eq("business_id", ctx.business.id);
      if (error) {
        console.error("[dashboard] save Stripe Connect account", error);
        return { ok: false, error: "Something went wrong saving that. Please try again." };
      }
    } else {
      // An account from before the Recipient configuration was requested
      // (or one that otherwise never got it) -- idempotent to re-request on
      // an account that already has it.
      await stripe.v2.core.accounts.update(accountId, recipientCapability);
    }

    const returnUrl = `${getDashboardUrl()}/billing`;
    const accountLink = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: { refresh_url: returnUrl, return_url: returnUrl },
      },
    });
    return { ok: true, url: accountLink.url };
  } catch (error) {
    console.error("[billing] Connect onboarding failed", error);
    return { ok: false, error: stripeErrorMessage(error, "Couldn't start Stripe onboarding. Try again.") };
  }
}

/**
 * Re-checks a pending Connect account directly with Stripe, rather than
 * relying only on the `account.updated` webhook — which needs "Listen to
 * events on connected accounts" enabled on the endpoint (see
 * docs/infrastructure.md) and, in local dev, `stripe listen
 * --forward-connect-to`. Easy to miss either, and without it
 * `stripe_connect_charges_enabled` gets stuck false even after the owner
 * finishes onboarding. Cheap to call on every billing page view: it's a
 * no-op once an account has no id, or already reads as enabled.
 */
export async function refreshConnectStatus(): Promise<void> {
  const ctx = await ownerContext();
  if (!ctx.ok) return;

  const { data: billingRow } = await ctx.supabase
    .from("business_billing")
    .select("stripe_connect_account_id, stripe_connect_charges_enabled")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  const accountId = billingRow?.stripe_connect_account_id as string | null;
  if (!accountId || billingRow?.stripe_connect_charges_enabled) return;

  try {
    // The classic v1 Accounts API still reflects the same underlying
    // account even though startConnectOnboarding creates it via v2, and its
    // flat `charges_enabled` matches exactly what the webhook stores.
    const account = await getStripe().accounts.retrieve(accountId);
    if (account.charges_enabled === billingRow?.stripe_connect_charges_enabled) return;
    const admin = createAdminClient();
    const { error } = await admin
      .from("business_billing")
      .update({ stripe_connect_charges_enabled: account.charges_enabled })
      .eq("business_id", ctx.business.id);
    if (error) console.error("[dashboard] save refreshed Connect status", error);
  } catch (error) {
    console.error("[dashboard] refresh Connect status failed", error);
  }
}
