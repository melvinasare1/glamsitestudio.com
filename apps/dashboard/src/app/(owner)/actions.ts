"use server";

import { revalidatePath } from "next/cache";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";

/**
 * Publish or unpublish the site. Going live for the first time happens
 * through startLaunchCheckout ($1 for the first 3 months) — this only re-checks the
 * subscription so an owner can't flip status=live by calling the action
 * directly without ever paying. Once launched, toggling on/off here is free.
 */
export async function setPublished(live: boolean): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  if (live && !ctx.business.name.trim()) return fail("Add your business name first.");

  if (live) {
    const { data: billingRow } = await ctx.supabase
      .from("business_billing")
      .select("subscription_status")
      .eq("business_id", ctx.business.id)
      .maybeSingle();
    const status = billingRow?.subscription_status;
    if (status !== "active" && status !== "trialing") {
      return fail("Launch your site from Billing first. $1 for your first 3 months of hosting.");
    }
  }

  const { error } = await ctx.supabase
    .from("businesses")
    .update(
      live
        ? { status: "live", published_at: ctx.business.publishedAt ?? new Date().toISOString() }
        : { status: "draft" }
    )
    .eq("id", ctx.business.id);
  if (error) return dbError("set published", error);

  revalidatePath("/", "layout");
  return { ok: true };
}
