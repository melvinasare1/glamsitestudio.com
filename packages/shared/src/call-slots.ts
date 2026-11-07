/**
 * Candidate times for a done-for-you launch call. This is our own team's
 * availability (fixed UK office hours), not a salon's — so it doesn't touch
 * booking.ts's per-business engine (staff schedules, services, time off).
 * Used by the marketing site's "done for you" lead form so someone can pick
 * a call time themselves instead of filling in an intake form and waiting
 * for us to reach out.
 */
import { addDays, formatClock, formatDayLong, todayIn, weekdayOf, zonedTimeToInstant } from "./booking";

const CALL_TIME_ZONE = "Europe/London";
const CALL_WINDOW_START_MINUTES = 10 * 60; // 10:00
const CALL_WINDOW_END_MINUTES = 16 * 60; // last slot starts 15:30
const CALL_SLOT_MINUTES = 30;
const CALL_MIN_NOTICE_HOURS = 24;
const CALL_SEARCH_DAYS = 10;

export type CallSlot = {
  /** ISO instant. */
  startsAt: string;
  /** "Tuesday 4 November" */
  dayLabel: string;
  /** "2:30pm" */
  timeLabel: string;
};

/** Up to `count` bookable call times: weekdays, 10am-4pm UK time, at least a day's notice. */
export function callSlotOptions(now: Date = new Date(), count = 12): CallSlot[] {
  const slots: CallSlot[] = [];
  const minInstant = now.getTime() + CALL_MIN_NOTICE_HOURS * 60 * 60 * 1000;
  const today = todayIn(CALL_TIME_ZONE, now);

  for (let day = 0; day < CALL_SEARCH_DAYS && slots.length < count; day++) {
    const ymd = day === 0 ? today : addDays(today, day);
    if (weekdayOf(ymd) >= 5) continue; // Saturday or Sunday

    for (let minutes = CALL_WINDOW_START_MINUTES; minutes < CALL_WINDOW_END_MINUTES; minutes += CALL_SLOT_MINUTES) {
      const instant = zonedTimeToInstant(ymd, minutes, CALL_TIME_ZONE);
      if (instant.getTime() < minInstant) continue;
      slots.push({
        startsAt: instant.toISOString(),
        dayLabel: formatDayLong(ymd),
        timeLabel: formatClock(instant, CALL_TIME_ZONE),
      });
      if (slots.length >= count) break;
    }
  }
  return slots;
}

/** Whether a submitted call time is one we'd actually offer (defends /api/leads against arbitrary timestamps). */
export function isValidCallSlot(startsAt: string, now: Date = new Date()): boolean {
  const target = new Date(startsAt).getTime();
  if (Number.isNaN(target)) return false;
  // Covers the whole CALL_SEARCH_DAYS window regardless of the usual display count.
  return callSlotOptions(now, 500).some((slot) => new Date(slot.startsAt).getTime() === target);
}
