"use server";

import { revalidatePath } from "next/cache";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";
import { parsePrice } from "@/lib/order";

const done = (): ActionResult => {
  revalidatePath("/referrals");
  return { ok: true };
};

/**
 * Turns the referral/earn program on or off, and sets the reward amount.
 * `referralReward` empty = program off (referral_reward_cents null); the
 * link already on each client's "share" page keeps working either way, but
 * no reward is issued while off (see processReferralReward in
 * appointments/actions.ts).
 */
export async function setReferralReward(referralReward: string): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { supabase, business } = ctx;

  const parsed = parsePrice(referralReward);
  if (!parsed.ok) return fail("Enter a valid reward amount, or leave it blank to turn the program off.");
  if (parsed.cents != null && parsed.cents <= 0) return fail("Enter a reward amount greater than zero.");

  const { error } = await supabase
    .from("businesses")
    .update({ referral_reward_cents: parsed.cents })
    .eq("id", business.id);
  if (error) return dbError("set referral reward", error);
  return done();
}
