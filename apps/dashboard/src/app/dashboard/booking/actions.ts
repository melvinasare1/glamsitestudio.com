"use server";

import { revalidatePath } from "next/cache";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";

/** Where the site's Book buttons go: nowhere special (contact section) or an external booking page. */
export async function saveBooking(input: { mode: "none" | "link"; url: string }): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  let url = input.url.trim().slice(0, 500);
  if (input.mode === "link") {
    if (!url) return fail("Paste the link to your booking page.");
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      new URL(url);
    } catch {
      return fail("That link doesn't look right.");
    }
  }
  if (input.mode !== "none" && input.mode !== "link") return fail("Choose how clients book.");

  const { error } = await ctx.supabase
    .from("businesses")
    .update({ booking_mode: input.mode, booking_url: input.mode === "link" ? url : "" })
    .eq("id", ctx.business.id);
  if (error) return dbError("save booking", error);

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
