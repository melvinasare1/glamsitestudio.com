"use server";

import { revalidatePath } from "next/cache";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";

/**
 * Publish or unpublish the site. Publishing isn't tied to payment yet;
 * stage 3 gates it on an active Stripe subscription.
 */
export async function setPublished(live: boolean): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  if (live && !ctx.business.name.trim()) return fail("Add your business name first.");

  const { error } = await ctx.supabase
    .from("businesses")
    .update(
      live
        ? { status: "live", published_at: ctx.business.publishedAt ?? new Date().toISOString() }
        : { status: "draft" }
    )
    .eq("id", ctx.business.id);
  if (error) return dbError("set published", error);

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
