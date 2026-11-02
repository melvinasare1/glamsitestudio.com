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
 * The "$1 first month" coupon depends on the hosting tier's price, so there's
 * one coupon per tier, created on first use with a deterministic id instead
 * of requiring anyone to set them up by hand in the Stripe dashboard.
 */
export async function getOrCreateFirstMonthCoupon(stripe: Stripe, hostingPriceCents: number): Promise<Stripe.Coupon> {
  const id = `first-month-${hostingPriceCents}`;
  try {
    return await stripe.coupons.retrieve(id);
  } catch {
    return await stripe.coupons.create({
      id,
      amount_off: hostingPriceCents - 100,
      currency: "usd",
      duration: "once",
      name: "First month, $1",
    });
  }
}
