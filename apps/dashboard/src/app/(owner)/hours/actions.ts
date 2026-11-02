"use server";

import { revalidatePath } from "next/cache";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";
import { weeklySlotsProblem } from "@/lib/weekly-hours";

export type HoursSlot = { weekday: number; opensAt: string; closesAt: string };

/** Replace the business's weekly opening hours. */
export async function saveHours(slots: HoursSlot[]): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  const problem = weeklySlotsProblem(
    slots.map((slot) => ({ weekday: slot.weekday, start: slot.opensAt, end: slot.closesAt })),
    { start: "Opening time", end: "Closing time" }
  );
  if (problem) return fail(problem);

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

  revalidatePath("/", "layout");
  return { ok: true };
}
