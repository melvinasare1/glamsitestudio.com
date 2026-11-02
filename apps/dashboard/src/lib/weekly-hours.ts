/** Weekly time slots (opening hours, staff working hours): shape and checks shared by forms and actions. */

export type WeeklySlot = { weekday: number; start: string; end: string };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** An error message an owner can act on, or null when the slots are fine. */
export function weeklySlotsProblem(slots: WeeklySlot[], words: { start: string; end: string }): string | null {
  if (slots.length > 21) return "That's too many time slots.";
  for (const slot of slots) {
    if (!Number.isInteger(slot.weekday) || slot.weekday < 0 || slot.weekday > 6) return "Unknown day.";
    if (!TIME.test(slot.start) || !TIME.test(slot.end)) return "Use times like 09:00.";
    if (slot.end <= slot.start) return `${words.end} must be after ${words.start.toLowerCase()}.`;
  }
  for (let day = 0; day < 7; day++) {
    const sorted = slots.filter((slot) => slot.weekday === day).sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end) return "Two time slots on the same day overlap.";
    }
  }
  return null;
}
