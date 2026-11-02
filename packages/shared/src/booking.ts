/**
 * Online booking: rules, time-zone helpers and the availability engine.
 *
 * Adapted from Ternarie's appointment slot generator, reworked for salons:
 * staff instead of trainers, each business's own time zone, minimum notice,
 * business-wide closures, and "anyone available" bookings.
 *
 * Everything here is pure (no database, no clock unless you pass one), so the
 * public booking page, the booking API and the dashboard share one source of
 * truth for which times can be booked. Keep runtime imports out of this file:
 * the unit tests run it directly with Node. Type-only imports are fine.
 */

import type { AppointmentStatus } from "./types";

// ---------------------------------------------------------------------------
// Rules (the booking_settings row, with defaults when there isn't one yet)
// ---------------------------------------------------------------------------

/**
 * How clients are told to pay when booking online. Informational only for
 * now — there's no Stripe Connect integration yet, so nothing is actually
 * charged. "full" and "deposit_50" are worked out from the service price;
 * "deposit_fixed" uses depositFixedCents.
 */
export type PaymentPolicy = "none" | "full" | "deposit_50" | "deposit_fixed";

export type BookingRules = {
  slotIntervalMinutes: number;
  /** How soon the next bookable time can be, e.g. 120 = not within 2 hours. */
  minNoticeMinutes: number;
  /** How far ahead clients can book. */
  maxAdvanceDays: number;
  /** Clients can cancel online until this many hours before the start. */
  cancellationNoticeHours: number;
  /** false = online bookings arrive as "pending" for the owner to confirm. */
  autoConfirm: boolean;
  requireDeposit: boolean;
  paymentPolicy: PaymentPolicy;
  /** Only set (and used) when paymentPolicy is "deposit_fixed". */
  depositFixedCents: number | null;
  /** Shown to clients before they book. */
  policyText: string;
};

export const DEFAULT_BOOKING_RULES: BookingRules = {
  slotIntervalMinutes: 15,
  minNoticeMinutes: 120,
  maxAdvanceDays: 60,
  cancellationNoticeHours: 24,
  autoConfirm: true,
  requireDeposit: false,
  paymentPolicy: "none",
  depositFixedCents: null,
  policyText: "",
};

export const SLOT_INTERVALS = [5, 10, 15, 20, 30, 60] as const;

type Row = Record<string, unknown>;

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
}

const PAYMENT_POLICIES: readonly PaymentPolicy[] = ["none", "full", "deposit_50", "deposit_fixed"];

export function bookingRulesFromRow(row: Row | null | undefined): BookingRules {
  if (!row) return { ...DEFAULT_BOOKING_RULES };
  const d = DEFAULT_BOOKING_RULES;
  return {
    slotIntervalMinutes: num(row.slot_interval_minutes, d.slotIntervalMinutes),
    minNoticeMinutes: num(row.min_notice_minutes, d.minNoticeMinutes),
    maxAdvanceDays: num(row.max_advance_days, d.maxAdvanceDays),
    cancellationNoticeHours: num(row.cancellation_notice_hours, d.cancellationNoticeHours),
    autoConfirm: typeof row.auto_confirm === "boolean" ? row.auto_confirm : d.autoConfirm,
    requireDeposit: typeof row.require_deposit === "boolean" ? row.require_deposit : d.requireDeposit,
    paymentPolicy:
      typeof row.payment_policy === "string" && (PAYMENT_POLICIES as string[]).includes(row.payment_policy)
        ? (row.payment_policy as PaymentPolicy)
        : d.paymentPolicy,
    depositFixedCents:
      typeof row.deposit_fixed_cents === "number" && Number.isFinite(row.deposit_fixed_cents)
        ? Math.trunc(row.deposit_fixed_cents)
        : null,
    policyText: typeof row.policy_text === "string" ? row.policy_text : d.policyText,
  };
}

/**
 * How much of a service's price the client is told to pay, given the
 * business's payment policy. Null means nothing is due at booking.
 */
export function depositAmountCents(
  policy: PaymentPolicy,
  priceCents: number | null,
  depositFixedCents: number | null
): number | null {
  if (policy === "full") return priceCents;
  if (policy === "deposit_50") return priceCents == null ? null : Math.round(priceCents / 2);
  if (policy === "deposit_fixed") return depositFixedCents;
  return null;
}

// ---------------------------------------------------------------------------
// Appointment statuses
// ---------------------------------------------------------------------------

export const APPOINTMENT_STATUSES: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];

/** Statuses that hold the time slot (matches the database's no-double-booking rule). */
export const ACTIVE_STATUSES: AppointmentStatus[] = ["pending", "confirmed"];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Waiting for you to confirm",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

// ---------------------------------------------------------------------------
// Dates and time zones
//
// Calendar dates are "YYYY-MM-DD" strings and wall-clock times are "HH:MM",
// both in the business's time zone. Instants are ISO strings in UTC.
// ---------------------------------------------------------------------------

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;
const HM = /^([01]\d|2[0-3]):([0-5]\d)/;

export function isYmd(value: string): boolean {
  const match = YMD.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value;
}

/** "09:30" or "09:30:00" → 570 */
export function minutesOfDay(value: string): number {
  const match = HM.exec(value);
  if (!match) return NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday, matching the weekday columns in the database. */
export function weekdayOf(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/** The Monday on or before a date. */
export function startOfWeek(ymd: string): string {
  return addDays(ymd, -weekdayOf(ymd));
}

const partsCache = new Map<string, Intl.DateTimeFormat>();

function zoneFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsCache.set(timeZone, formatter);
  }
  return formatter;
}

/** The calendar date and wall-clock time of an instant in a time zone. */
export function zonedParts(instant: Date, timeZone: string): { ymd: string; hm: string; minutes: number } {
  const parts: Record<string, string> = {};
  for (const part of zoneFormatter(timeZone).formatToParts(instant)) parts[part.type] = part.value;
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
    hm: `${hour}:${parts.minute}`,
    minutes: Number(hour) * 60 + Number(parts.minute),
  };
}

/** Minutes the zone is ahead of UTC at that instant (London summer = 60). */
function offsetMinutes(instant: Date, timeZone: string): number {
  const parts: Record<string, string> = {};
  for (const part of zoneFormatter(timeZone).formatToParts(instant)) parts[part.type] = part.value;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === "24" ? "0" : parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** A wall-clock time on a date in a time zone → the instant it happens. */
export function zonedTimeToInstant(ymd: string, minutes: number, timeZone: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, minutes);
  // Two passes settle the offset either side of a daylight-saving change.
  let instant = naive - offsetMinutes(new Date(naive), timeZone) * 60_000;
  instant = naive - offsetMinutes(new Date(instant), timeZone) * 60_000;
  return new Date(instant);
}

/** Today's date in a time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return zonedParts(now, timeZone).ymd;
}

/** A valid IANA time zone, or London. */
export function safeTimeZone(value: string | null | undefined): string {
  if (!value) return "Europe/London";
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value });
    return value;
  } catch {
    return "Europe/London";
  }
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

/** One stretch of working time on a weekday, local to the business. */
export type WeeklyBlock = { weekday: number; start: string; end: string };

/** A team member who can do the service, with their weekly hours. */
export type StaffSchedule = { staffId: string; blocks: WeeklyBlock[] };

/**
 * Time that can't be booked. `staffId: null` blocks everyone (a closure).
 * Existing appointments should include their service's buffer in `endsAt`.
 */
export type BusyPeriod = { staffId: string | null; startsAt: string; endsAt: string };

export type AvailabilityInput = {
  timeZone: string;
  rules: Pick<BookingRules, "slotIntervalMinutes" | "minNoticeMinutes" | "maxAdvanceDays">;
  service: { durationMinutes: number; bufferMinutes: number };
  staff: StaffSchedule[];
  busy: BusyPeriod[];
  /** First and last calendar day to search, inclusive, local to the business. */
  from: string;
  to: string;
  now?: Date;
};

export type Slot = {
  startsAt: string;
  endsAt: string;
  /** Local date and time, for grouping and display. */
  date: string;
  time: string;
  /** Team members free at this time, in the order they were given. */
  staffIds: string[];
};

/** Longest stretch we search in one call, to keep requests cheap. */
export const MAX_SEARCH_DAYS = 62;

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** The first and last day clients may book, given the rules. */
export function bookableWindow(
  timeZone: string,
  rules: Pick<BookingRules, "maxAdvanceDays">,
  now: Date = new Date()
): { first: string; last: string } {
  const first = todayIn(timeZone, now);
  return { first, last: addDays(first, rules.maxAdvanceDays) };
}

/**
 * Every bookable start time for one service between two dates.
 *
 * A time is offered when at least one team member:
 *   - is working for the whole appointment (it must end by their finish time),
 *   - has nothing else on, counting the new appointment's buffer after it,
 *   - and the business isn't closed then.
 * Times inside the minimum notice, or past the advance-booking limit, are skipped.
 */
export function availableSlots(input: AvailabilityInput): Slot[] {
  const now = input.now ?? new Date();
  const timeZone = safeTimeZone(input.timeZone);
  const duration = input.service.durationMinutes;
  const buffer = Math.max(0, input.service.bufferMinutes);
  const interval = Math.max(5, input.rules.slotIntervalMinutes);
  if (!(duration > 0) || !isYmd(input.from) || !isYmd(input.to)) return [];

  const window = bookableWindow(timeZone, input.rules, now);
  const from = input.from < window.first ? window.first : input.from;
  let to = input.to > window.last ? window.last : input.to;
  if (to > addDays(from, MAX_SEARCH_DAYS)) to = addDays(from, MAX_SEARCH_DAYS);
  if (from > to) return [];

  const earliest = now.getTime() + Math.max(0, input.rules.minNoticeMinutes) * 60_000;

  const busy = input.busy
    .map((period) => ({
      staffId: period.staffId,
      start: new Date(period.startsAt).getTime(),
      end: new Date(period.endsAt).getTime(),
    }))
    .filter((period) => Number.isFinite(period.start) && Number.isFinite(period.end) && period.end > period.start);
  const closures = busy.filter((period) => period.staffId === null);

  const byStart = new Map<string, Slot>();

  for (let day = from; day <= to; day = addDays(day, 1)) {
    const weekday = weekdayOf(day);

    for (const person of input.staff) {
      const theirBusy = busy.filter((period) => period.staffId === person.staffId);

      for (const block of person.blocks) {
        if (block.weekday !== weekday) continue;
        const blockStart = minutesOfDay(block.start);
        const blockEnd = minutesOfDay(block.end);
        if (!(blockEnd > blockStart)) continue;

        for (let minute = blockStart; minute + duration <= blockEnd; minute += interval) {
          const start = zonedTimeToInstant(day, minute, timeZone).getTime();
          if (start < earliest) continue;
          const end = start + duration * 60_000;
          const heldUntil = end + buffer * 60_000;

          // Closures block the appointment itself; buffers only matter between appointments.
          if (closures.some((period) => overlaps(start, end, period.start, period.end))) continue;
          if (theirBusy.some((period) => overlaps(start, heldUntil, period.start, period.end))) continue;

          const key = new Date(start).toISOString();
          const existing = byStart.get(key);
          if (existing) {
            if (!existing.staffIds.includes(person.staffId)) existing.staffIds.push(person.staffId);
          } else {
            const hours = Math.floor(minute / 60);
            const mins = minute % 60;
            byStart.set(key, {
              startsAt: key,
              endsAt: new Date(end).toISOString(),
              date: day,
              time: `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`,
              staffIds: [person.staffId],
            });
          }
        }
      }
    }
  }

  const order = new Map(input.staff.map((person, index) => [person.staffId, index]));
  return [...byStart.values()]
    .map((slot) => ({ ...slot, staffIds: slot.staffIds.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)) }))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/**
 * Who gets an "anyone available" booking: whoever has the fewest
 * appointments that day, so work spreads across the team. Ties go to the
 * first in the team's display order.
 */
export function pickStaff(freeStaffIds: string[], appointmentsThatDay: Record<string, number>): string | null {
  let best: string | null = null;
  let bestCount = Infinity;
  for (const id of freeStaffIds) {
    const count = appointmentsThatDay[id] ?? 0;
    if (count < bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Which team members can be booked for a service: bookable people linked to
 * it, or every bookable person when nobody is linked yet (a solo owner who
 * hasn't ticked their services shouldn't be unbookable).
 */
export function staffForService<T extends { id: string; isBookable: boolean; serviceIds: string[] }>(
  staff: T[],
  serviceId: string
): T[] {
  const bookable = staff.filter((person) => person.isBookable);
  const linked = bookable.filter((person) => person.serviceIds.includes(serviceId));
  const anyLinked = staff.some((person) => person.serviceIds.includes(serviceId));
  return anyLinked ? linked : bookable;
}

/**
 * Weekly hours per person: their own working hours, or the business's
 * opening hours until the owner sets some.
 */
export function weeklyBlocksFor(
  staffId: string,
  workingHours: { staffId: string; weekday: number; startsAt: string; endsAt: string }[],
  openingHours: { weekday: number; opensAt: string; closesAt: string }[]
): WeeklyBlock[] {
  const own = workingHours.filter((row) => row.staffId === staffId);
  if (own.length) return own.map((row) => ({ weekday: row.weekday, start: row.startsAt, end: row.endsAt }));
  return openingHours.map((row) => ({ weekday: row.weekday, start: row.opensAt, end: row.closesAt }));
}

/** Can the client still cancel online? */
export function canClientCancel(
  appointment: { status: string; startsAt: string },
  rules: Pick<BookingRules, "cancellationNoticeHours">,
  now: Date = new Date()
): boolean {
  if (!ACTIVE_STATUSES.includes(appointment.status as AppointmentStatus)) return false;
  const start = new Date(appointment.startsAt).getTime();
  return start - now.getTime() >= rules.cancellationNoticeHours * 3_600_000;
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

/** "Tuesday 4 November" in the business's time zone. */
export function formatDayLong(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

/** "Tue 4 Nov" */
export function formatDayShort(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

/** "2:30pm" for an instant, in the business's time zone. */
export function formatClock(instant: string | Date, timeZone: string): string {
  const { hm } = zonedParts(new Date(instant), safeTimeZone(timeZone));
  const [h, m] = hm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${twelve}${suffix}` : `${twelve}:${String(m).padStart(2, "0")}${suffix}`;
}

/** "Tuesday 4 November, 2:30pm" */
export function formatWhen(instant: string, timeZone: string): string {
  const zone = safeTimeZone(timeZone);
  return `${formatDayLong(zonedParts(new Date(instant), zone).ymd)}, ${formatClock(instant, zone)}`;
}
