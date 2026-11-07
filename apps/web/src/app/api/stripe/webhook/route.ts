import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { confirmLaunchFromSession } from "@glamsite/shared/billing-sync";
import { payoutFailedEmail, payoutFailedStaffNotifyEmail, sendEmail } from "@glamsite/shared/email";
import { formatMoney } from "@glamsite/shared/format";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { getDashboardUrl } from "@glamsite/shared/supabase/env";
import { getStripe } from "@glamsite/shared/stripe";
import { confirmBookingPayment } from "@/lib/booking";

/**
 * Sign-up (apps/dashboard/src/app/signup/actions.ts) creates the business
 * directly, with no payment involved. The only Checkout flow that lands
 * here for a business is "launch" — the $1 for the first 3 months of hosting that
 * makes a draft site public (apps/dashboard/src/app/(owner)/billing/actions.ts
 * startLaunchCheckout) — plus the booking-deposit flow below. Keeps
 * subscription_status in sync afterwards.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  // Two Stripe webhook endpoints share this URL: an "Account" endpoint for
  // our own events (checkout.session.completed, subscriptions) and a
  // "Connect" endpoint for connected-account events (account.updated,
  // payout.failed) -- Stripe only lets `connect` be set at creation, so
  // these can't be merged into one endpoint, and each has its own signing
  // secret. STRIPE_CONNECT_WEBHOOK_SECRET is optional locally (e.g. only
  // running `stripe listen --forward-to`, not `--forward-connect-to`).
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(
    (value): value is string => Boolean(value)
  );
  if (!signature || !secrets.length) {
    console.error("[stripe webhook] missing signature header or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  let event: Stripe.Event | undefined;
  for (const secret of secrets) {
    try {
      event = getStripe().webhooks.constructEvent(body, signature, secret);
      break;
    } catch {
      // Try the next secret -- a mismatch here just means this event came
      // from the other endpoint, not that the request is forged.
    }
  }
  if (!event) {
    console.error("[stripe webhook] signature verification failed against every configured secret");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.appointmentId) {
          await confirmBookingPayment(session);
        } else if (session.metadata?.businessId) {
          await confirmLaunchFromSession(session);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case "account.updated":
        await syncConnectAccount(event.data.object as Stripe.Account);
        break;
      case "payout.failed":
        await notifyPayoutFailed(event.data.object as Stripe.Payout, event.account);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`[stripe webhook] handling ${event.type} failed`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Express accounts (stage 5 Connect). Requires "Listen to events on
 * connected accounts" enabled on this endpoint in the Stripe Dashboard —
 * see docs/infrastructure.md.
 */
async function syncConnectAccount(account: Stripe.Account): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("business_billing")
    .update({ stripe_connect_charges_enabled: account.charges_enabled })
    .eq("stripe_connect_account_id", account.id);
  if (error) console.error("[stripe webhook] Connect account sync failed", error);
}

/**
 * A connected account's automatic payout to their bank bounced (closed
 * account, bad details, etc. -- unrelated to a Checkout charge, which fails
 * synchronously and never reaches here). Only arrives because "Listen to
 * events on connected accounts" is enabled (docs/infrastructure.md), so the
 * account id comes from `event.account`, not the payout object itself.
 * The money just sits back in the salon's Stripe balance until they fix it,
 * so this alerts the owner (to actually get paid) and support (visibility).
 */
async function notifyPayoutFailed(payout: Stripe.Payout, accountId: string | undefined): Promise<void> {
  if (!accountId) return;
  const admin = createAdminClient();

  const { data: billing } = await admin
    .from("business_billing")
    .select("business_id")
    .eq("stripe_connect_account_id", accountId)
    .maybeSingle();
  if (!billing) return;

  const { data: business } = await admin
    .from("businesses")
    .select("name, email, owner_id, currency")
    .eq("id", billing.business_id as string)
    .maybeSingle();
  if (!business) return;

  let ownerEmail = (business.email as string).trim();
  if (!ownerEmail) {
    const { data } = await admin.auth.admin.getUserById(business.owner_id as string);
    ownerEmail = data.user?.email ?? "";
  }

  const details = {
    businessName: business.name as string,
    amount: formatMoney(payout.amount, (payout.currency || (business.currency as string)).toUpperCase()),
    reason: payout.failure_message || payout.failure_code || "no reason given",
  };
  const billingUrl = `${getDashboardUrl()}/billing`;
  const inboxEmail = process.env.SUPPORT_INBOX_EMAIL;

  const attempts: Promise<unknown>[] = [];
  if (ownerEmail) attempts.push(sendEmail({ to: ownerEmail, ...payoutFailedEmail(details, billingUrl) }));
  if (inboxEmail) attempts.push(sendEmail({ to: inboxEmail, ...payoutFailedStaffNotifyEmail(details) }));
  await Promise.allSettled(attempts);
}

async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const admin = createAdminClient();
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
  const { error } = await admin
    .from("business_billing")
    .update({
      subscription_status: subscription.status,
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
    })
    .eq("stripe_subscription_id", subscription.id);
  if (error) console.error("[stripe webhook] subscription sync failed", error);
}
