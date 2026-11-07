import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { ACTIVE_STATUSES, bookingRulesFromRow } from "@glamsite/shared/booking";
import { payoutFailedEmail, payoutFailedStaffNotifyEmail, sendEmail } from "@glamsite/shared/email";
import { formatMoney } from "@glamsite/shared/format";
import { appointmentFromRow, businessFromRow } from "@glamsite/shared/mappers";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { getDashboardUrl } from "@glamsite/shared/supabase/env";
import { getStripe, refundConnectPayment } from "@glamsite/shared/stripe";
import { sendBookingConfirmationEmails } from "@/lib/booking";

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
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    console.error("[stripe webhook] missing signature header or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("[stripe webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.appointmentId) {
          await confirmBookingPayment(session);
        } else if (session.metadata?.businessId) {
          await confirmLaunch(session);
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

function toId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * The $1 launch payment on an already-existing draft business (see
 * startLaunchCheckout). Puts the subscription in place and takes the site
 * live — the one thing payment gates in this app.
 */
async function confirmLaunch(session: Stripe.Checkout.Session): Promise<void> {
  const businessId = session.metadata?.businessId;
  if (!businessId) return;

  const admin = createAdminClient();

  const { error: billingError } = await admin
    .from("business_billing")
    .update({
      subscription_status: "active",
      stripe_customer_id: toId(session.customer),
      stripe_subscription_id: toId(session.subscription),
    })
    .eq("business_id", businessId);
  if (billingError) {
    console.error("[stripe webhook] launch billing update failed", businessId, billingError);
    return;
  }

  const { data: business } = await admin.from("businesses").select("published_at, name").eq("id", businessId).maybeSingle();
  if (!business) {
    console.error("[stripe webhook] launch: business not found", businessId);
    return;
  }

  const { error: statusError } = await admin
    .from("businesses")
    .update({ status: "live", published_at: business.published_at ?? new Date().toISOString() })
    .eq("id", businessId);
  if (statusError) console.error("[stripe webhook] launch publish failed", businessId, statusError);
}

/**
 * A client paid their deposit/full price via Checkout on the salon's
 * connected account (stage 5 Connect). Confirms the appointment and sends
 * the usual booking emails. If the 15-minute hold already expired and
 * released the slot (createBooking's expirePendingPayments), re-check
 * before reinstating — if someone else took it, or it's now in the past,
 * refund instead of silently keeping the client's money for a slot they
 * don't have.
 */
async function confirmBookingPayment(session: Stripe.Checkout.Session): Promise<void> {
  const appointmentId = session.metadata?.appointmentId;
  if (!appointmentId) return;
  const finalStatus = session.metadata?.finalStatus === "confirmed" ? "confirmed" : "pending";
  const paymentIntentId = toId(session.payment_intent);

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("appointments")
    .select("*, clients!appointments_client_id_business_id_fkey(name, email, phone), staff(name)")
    .eq("id", appointmentId)
    .maybeSingle();
  if (error || !row) {
    console.error("[stripe webhook] booking payment: appointment not found", appointmentId, error);
    return;
  }

  if (row.status === "cancelled") {
    const conflict = await admin
      .from("appointments")
      .select("id")
      .eq("business_id", row.business_id)
      .eq("staff_id", row.staff_id)
      .neq("id", appointmentId)
      .in("status", ACTIVE_STATUSES)
      .lt("starts_at", row.ends_at as string)
      .gt("ends_at", row.starts_at as string)
      .maybeSingle();
    const stillUpcoming = new Date(row.starts_at as string).getTime() > Date.now();
    if (conflict.data || !stillUpcoming) {
      if (paymentIntentId) {
        try {
          await refundConnectPayment(getStripe(), paymentIntentId, row.deposit_cents as number);
        } catch (refundError) {
          console.error("[stripe webhook] refund for expired booking slot failed", appointmentId, refundError);
        }
      }
      console.error("[stripe webhook] booking payment succeeded after the slot was lost; refunded", appointmentId);
      return;
    }
  }

  const { error: updateError } = await admin
    .from("appointments")
    .update({ status: finalStatus, deposit_status: "paid", stripe_payment_intent_id: paymentIntentId, cancelled_at: null })
    .eq("id", appointmentId);
  if (updateError) {
    console.error("[stripe webhook] booking payment confirm failed", appointmentId, updateError);
    return;
  }

  const [businessResult, settingsResult] = await Promise.all([
    admin.from("businesses").select("*").eq("id", row.business_id).maybeSingle(),
    admin.from("booking_settings").select("*").eq("business_id", row.business_id).maybeSingle(),
  ]);
  if (!businessResult.data) return;

  const business = businessFromRow(businessResult.data);
  const rules = bookingRulesFromRow(settingsResult.data);
  const appointment = appointmentFromRow({ ...row, status: finalStatus });
  const client = appointment.client ?? { name: "", email: "", phone: "" };
  await sendBookingConfirmationEmails(
    admin,
    business,
    rules,
    {
      serviceName: appointment.serviceName,
      startsAt: appointment.startsAt,
      staffName: appointment.staffName,
      priceCents: appointment.priceCents,
      clientNotes: appointment.clientNotes,
    },
    client,
    finalStatus,
    row.manage_token as string
  );
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
