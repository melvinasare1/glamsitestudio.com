"use server";

import { revalidatePath } from "next/cache";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";
import { parsePrice } from "@/lib/order";

const done = (): ActionResult => {
  revalidatePath("/discounts");
  return { ok: true };
};

const CODE_RE = /^[A-Za-z0-9-]{1,40}$/;

export type DiscountCodeInput = {
  id?: string;
  code: string;
  kind: "percent" | "fixed";
  /** 1-100, used when kind is "percent". */
  percentOff: number;
  /** £/€/$ text, used when kind is "fixed". */
  amountOff: string;
  isActive: boolean;
  /** Empty string = unlimited. */
  maxRedemptions: string;
  /** Empty string = never expires. "YYYY-MM-DD". */
  expiresAt: string;
};

export async function saveDiscountCode(input: DiscountCodeInput): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { supabase, business } = ctx;

  const code = input.code.trim().toUpperCase();
  if (!CODE_RE.test(code)) return fail("Codes can only use letters, numbers and hyphens.");
  if (input.kind === "percent" && (!Number.isFinite(input.percentOff) || input.percentOff < 1 || input.percentOff > 100)) {
    return fail("Enter a percentage between 1 and 100.");
  }
  const amountOff = parsePrice(input.amountOff);
  if (input.kind === "fixed" && (!amountOff.ok || !amountOff.cents || amountOff.cents <= 0)) {
    return fail("Enter an amount off greater than zero.");
  }
  const maxRedemptions = input.maxRedemptions.trim() ? Number(input.maxRedemptions) : null;
  if (maxRedemptions != null && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)) {
    return fail("Enter a redemption limit of 1 or more, or leave it blank.");
  }
  const expiresAt = input.expiresAt.trim() ? new Date(`${input.expiresAt}T23:59:59`).toISOString() : null;

  const row = {
    business_id: business.id,
    code,
    kind: input.kind,
    percent_off: input.kind === "percent" ? Math.round(input.percentOff) : null,
    amount_off_cents: input.kind === "fixed" && amountOff.ok ? amountOff.cents : null,
    is_active: input.isActive,
    max_redemptions: maxRedemptions,
    expires_at: expiresAt,
  };

  const { error } = input.id
    ? await supabase.from("discount_codes").update(row).eq("id", input.id).eq("business_id", business.id)
    : await supabase.from("discount_codes").insert(row);

  if (error) {
    if (error.code === "23505") return fail("You already have a code with that name.");
    return dbError("save discount code", error);
  }
  return done();
}

export async function deleteDiscountCode(id: string): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("discount_codes").delete().eq("id", id).eq("business_id", ctx.business.id);
  if (error) return dbError("delete discount code", error);
  return done();
}

export async function setDiscountCodeActive(id: string, isActive: boolean): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase
    .from("discount_codes")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("business_id", ctx.business.id);
  if (error) return dbError("update discount code", error);
  return done();
}
