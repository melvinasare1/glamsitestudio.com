/**
 * Launch confirmation, shared between the Stripe webhook (apps/web) and the
 * dashboard's own post-Checkout page (apps/dashboard) -- the dashboard reads
 * the Checkout Session straight from Stripe right after the redirect rather
 * than trust the webhook to have landed by then (same reasoning as
 * refreshConnectStatus in apps/dashboard/.../billing/actions.ts). Idempotent:
 * safe to call more than once for the same session.
 */
import type Stripe from "stripe";
import { createAdminClient } from "./supabase/admin";
import { stripeObjectId } from "./stripe";

export async function confirmLaunchFromSession(session: Stripe.Checkout.Session): Promise<void> {
  const businessId = session.metadata?.businessId;
  if (!businessId) return;

  const admin = createAdminClient();

  const { error: billingError } = await admin
    .from("business_billing")
    .update({
      subscription_status: "active",
      stripe_customer_id: stripeObjectId(session.customer),
      stripe_subscription_id: stripeObjectId(session.subscription),
    })
    .eq("business_id", businessId);
  if (billingError) {
    console.error("[billing] launch billing update failed", businessId, billingError);
    return;
  }

  const { data: business } = await admin.from("businesses").select("published_at").eq("id", businessId).maybeSingle();
  if (!business) {
    console.error("[billing] launch: business not found", businessId);
    return;
  }

  const { error: statusError } = await admin
    .from("businesses")
    .update({ status: "live", published_at: business.published_at ?? new Date().toISOString() })
    .eq("id", businessId);
  if (statusError) console.error("[billing] launch publish failed", businessId, statusError);
}
