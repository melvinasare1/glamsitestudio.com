"use server";

import { revalidatePath } from "next/cache";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";

export type HoursSlot = { weekday: number; opensAt: string; closesAt: string };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Replace the business's weekly opening hours. */
export async function saveHours(slots: HoursSlot[]): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  if (slots.length > 21) return fail("That's too many time slots.");
  for (const slot of slots) {
    if (!Number.isInteger(slot.weekday) || slot.weekday < 0 || slot.weekday > 6) return fail("Unknown day.");
    if (!TIME.test(slot.opensAt) || !TIME.test(slot.closesAt)) return fail("Use times like 09:00.");
    if (slot.closesAt <= slot.opensAt) return fail("Closing time must be after opening time.");
  }
  for (let day = 0; day < 7; day++) {
    const sorted = slots.filter((slot) => slot.weekday === day).sort((a, b) => a.opensAt.localeCompare(b.opensAt));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].opensAt < sorted[i - 1].closesAt) return fail("Two time slots on the same day overlap.");
    }
  }

  const { error: deleteError } = await ctx.supabase.from("opening_hours").delete().eq("business_id", ctx.business.id);
  if (deleteError) return dbError("clear hours", deleteError);

  if (slots.length) {
    const { error } = await ctx.supabase.from("opening_hours").insert(
      slots.map((slot) => ({
        business_id: ctx.business.id,
        weekday: slot.weekday,
        opens_at: slot.opensAt,
        closes_at: slot.closesAt,
      }))
    );
    if (error) return dbError("save hours", error);
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
