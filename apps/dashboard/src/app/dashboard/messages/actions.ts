"use server";

import { revalidatePath } from "next/cache";
import { dbError, ownerContext, type ActionResult } from "@/lib/business";

export async function setEnquiryRead(id: string, isRead: boolean): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase
    .from("enquiries")
    .update({ is_read: isRead })
    .eq("id", id)
    .eq("business_id", ctx.business.id);
  if (error) return dbError("mark enquiry", error);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteEnquiry(id: string): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("enquiries").delete().eq("id", id).eq("business_id", ctx.business.id);
  if (error) return dbError("delete enquiry", error);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
