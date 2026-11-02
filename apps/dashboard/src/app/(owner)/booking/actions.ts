"use server";

import { revalidatePath } from "next/cache";
import {
  SLOT_INTERVALS,
  addDays,
  isYmd,
  minutesOfDay,
  safeTimeZone,
  zonedTimeToInstant,
  type PaymentPolicy,
} from "@glamsite/shared/booking";
import { dbError, fail, ownerContext, type ActionResult } from "@/lib/business";
import { parsePrice } from "@/lib/order";
import { weeklySlotsProblem, type WeeklySlot } from "@/lib/weekly-hours";

type Mode = "none" | "link" | "glamsite";

const done = (): ActionResult => {
  revalidatePath("/", "layout");
  return { ok: true };
};

/** Where the site's Book buttons go: Glam Site booking, the owner's own booking page, or the contact section. */
export async function saveBooking(input: { mode: Mode; url: string }): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  if (input.mode !== "none" && input.mode !== "link" && input.mode !== "glamsite") return fail("Choose how clients book.");

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

  const { error } = await ctx.supabase
    .from("businesses")
    .update({ booking_mode: input.mode, booking_url: input.mode === "link" ? url : "" })
    .eq("id", ctx.business.id);
  if (error) return dbError("save booking", error);
  return done();
}

export type RulesInput = {
  slotIntervalMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  cancellationNoticeHours: number;
  autoConfirm: boolean;
  paymentPolicy: PaymentPolicy;
  /** As entered by the owner, e.g. "10" for £10. Only used when paymentPolicy is "deposit_fixed". */
  depositFixedAmount: string;
  policyText: string;
};

const inRange = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max;
const PAYMENT_POLICIES: readonly PaymentPolicy[] = ["none", "full", "deposit_50", "deposit_fixed"];

export async function saveBookingRules(input: RulesInput): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;

  if (!(SLOT_INTERVALS as readonly number[]).includes(input.slotIntervalMinutes)) return fail("Choose how often times start.");
  if (!inRange(input.minNoticeMinutes, 0, 20160)) return fail("Choose how much notice you need.");
  if (!inRange(input.maxAdvanceDays, 1, 365)) return fail("Choose how far ahead clients can book.");
  if (!inRange(input.cancellationNoticeHours, 0, 336)) return fail("Choose the cancellation cut-off.");
  if (!PAYMENT_POLICIES.includes(input.paymentPolicy)) return fail("Choose how clients pay.");

  let depositFixedCents: number | null = null;
  if (input.paymentPolicy === "deposit_fixed") {
    const price = parsePrice(input.depositFixedAmount);
    if (!price.ok || price.cents == null) return fail("Enter the deposit amount, like 10 or 10.50.");
    depositFixedCents = price.cents;
  }

  const { error } = await ctx.supabase.from("booking_settings").upsert(
    {
      business_id: ctx.business.id,
      slot_interval_minutes: input.slotIntervalMinutes,
      min_notice_minutes: input.minNoticeMinutes,
      max_advance_days: input.maxAdvanceDays,
      cancellation_notice_hours: input.cancellationNoticeHours,
      auto_confirm: input.autoConfirm,
      payment_policy: input.paymentPolicy,
      deposit_fixed_cents: depositFixedCents,
      policy_text: input.policyText.trim().slice(0, 2000),
    },
    { onConflict: "business_id" }
  );
  if (error) return dbError("save booking rules", error);
  return done();
}

async function ownStaff(ctx: Extract<Awaited<ReturnType<typeof ownerContext>>, { ok: true }>, staffId: string) {
  const { data } = await ctx.supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  return Boolean(data);
}

/** Replace one team member's weekly working hours. An empty list means "use opening hours". */
export async function saveStaffHours(staffId: string, slots: WeeklySlot[]): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  if (!(await ownStaff(ctx, staffId))) return fail("That team member no longer exists.");

  const problem = weeklySlotsProblem(slots, { start: "Start time", end: "Finish time" });
  if (problem) return fail(problem);

  const { error: deleteError } = await ctx.supabase
    .from("staff_working_hours")
    .delete()
    .eq("business_id", ctx.business.id)
    .eq("staff_id", staffId);
  if (deleteError) return dbError("clear staff hours", deleteError);

  if (slots.length) {
    const { error } = await ctx.supabase.from("staff_working_hours").insert(
      slots.map((slot) => ({
        business_id: ctx.business.id,
        staff_id: staffId,
        weekday: slot.weekday,
        starts_at: slot.start,
        ends_at: slot.end,
      }))
    );
    if (error) return dbError("save staff hours", error);
  }
  return done();
}

export type TimeOffInput = {
  /** null closes the whole business. */
  staffId: string | null;
  allDay: boolean;
  /** All day: first and last day, inclusive. Otherwise one day with start and end times. */
  fromDate: string;
  toDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export async function addTimeOff(input: TimeOffInput): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  if (input.staffId && !(await ownStaff(ctx, input.staffId))) return fail("That team member no longer exists.");

  const zone = safeTimeZone(ctx.business.timezone);
  if (!isYmd(input.fromDate)) return fail("Choose a start date.");
  let startsAt: Date;
  let endsAt: Date;
  if (input.allDay) {
    const to = input.toDate || input.fromDate;
    if (!isYmd(to) || to < input.fromDate) return fail("The end date must be on or after the start date.");
    if (to > addDays(input.fromDate, 366)) return fail("Add time off a year at a time at most.");
    startsAt = zonedTimeToInstant(input.fromDate, 0, zone);
    endsAt = zonedTimeToInstant(addDays(to, 1), 0, zone);
  } else {
    const start = minutesOfDay(input.startTime);
    const end = minutesOfDay(input.endTime);
    if (Number.isNaN(start) || Number.isNaN(end)) return fail("Choose a start and end time.");
    if (end <= start) return fail("The end time must be after the start time.");
    startsAt = zonedTimeToInstant(input.fromDate, start, zone);
    endsAt = zonedTimeToInstant(input.fromDate, end, zone);
  }

  const { error } = await ctx.supabase.from("staff_time_off").insert({
    business_id: ctx.business.id,
    staff_id: input.staffId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason: input.reason.trim().slice(0, 200),
  });
  if (error) return dbError("add time off", error);
  return done();
}

export async function deleteTimeOff(id: string): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("staff_time_off").delete().eq("id", id).eq("business_id", ctx.business.id);
  return error ? dbError("delete time off", error) : done();
}
