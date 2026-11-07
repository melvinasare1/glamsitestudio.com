/**
 * Server-only Stripe client. Never import this from a "use client" file —
 * it reads STRIPE_SECRET_KEY, which must stay server-side.
 */
import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  client = new Stripe(key);
  return client;
}

/**
 * Turns a caught Stripe/config error into a message safe to show an owner.
 * Stripe's own error messages (e.g. "Connect isn't enabled for this account")
 * never contain the API key or other secrets, so these are safe to surface
 * as-is instead of hiding behind a generic "try again" string that makes
 * every failure look identical. Falls back to `fallback` for anything else
 * (e.g. a Supabase/network error, which could contain unrelated detail).
 */
export function stripeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Stripe.errors.StripeError) return error.message;
  if (error instanceof Error && error.message === "Stripe is not configured. Set STRIPE_SECRET_KEY.") {
    return error.message;
  }
  return fallback;
}

export function stripeObjectId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * Refund a booking deposit/payment collected via Connect (destination
 * charge: payment_intent_data.transfer_data in the Checkout session —
 * apps/web/src/lib/booking.ts). `reverse_transfer` pulls the transferred
 * amount back out of the salon's connected account instead of leaving the
 * platform to eat the loss; `refund_application_fee` gives back our cut of
 * whatever's refunded. Both default to false on Stripe's API, so a plain
 * `refunds.create` here would silently refund the client while the salon
 * keeps the money and we keep our fee.
 */
export async function refundConnectPayment(
  stripe: Stripe,
  paymentIntentId: string,
  amountCents: number
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountCents,
    reverse_transfer: true,
    refund_application_fee: true,
  });
}

const HOSTING_PRODUCT_ID = "glamsite-hosting";

/**
 * A single persistent Stripe Product for hosting, shared across tiers (the
 * price varies, not the product) — needed because subscription item updates
 * require an existing product id, unlike Checkout's inline product_data.
 */
export async function getOrCreateHostingProduct(stripe: Stripe): Promise<Stripe.Product> {
  try {
    return await stripe.products.retrieve(HOSTING_PRODUCT_ID);
  } catch {
    return await stripe.products.create({ id: HOSTING_PRODUCT_ID, name: "Glam Site Studios hosting" });
  }
}

const BOOKING_ADDON_PRODUCT_ID = "glamsite-booking-addon";

/**
 * A single persistent Stripe Product for the booking add-on, same reason as
 * getOrCreateHostingProduct: subscription item create/update needs a real
 * product id, not Checkout's inline product_data.
 */
export async function getOrCreateBookingAddonProduct(stripe: Stripe): Promise<Stripe.Product> {
  try {
    return await stripe.products.retrieve(BOOKING_ADDON_PRODUCT_ID);
  } catch {
    return await stripe.products.create({ id: BOOKING_ADDON_PRODUCT_ID, name: "Glam Site Studios booking add-on" });
  }
}

export const FIRST_MONTHS_AT_DOLLAR = 3;

/**
 * The "$1 for the first N months" coupon depends on the hosting tier's
 * price, so there's one coupon per tier, created on first use with a
 * deterministic id instead of requiring anyone to set them up by hand in
 * the Stripe dashboard.
 */
export async function getOrCreateFirstMonthCoupon(stripe: Stripe, hostingPriceCents: number): Promise<Stripe.Coupon> {
  const id = `first-${FIRST_MONTHS_AT_DOLLAR}-months-${hostingPriceCents}`;
  try {
    return await stripe.coupons.retrieve(id);
  } catch {
    return await stripe.coupons.create({
      id,
      amount_off: hostingPriceCents - 100,
      currency: "usd",
      duration: "repeating",
      duration_in_months: FIRST_MONTHS_AT_DOLLAR,
      name: `First ${FIRST_MONTHS_AT_DOLLAR} months, $1`,
    });
  }
}
