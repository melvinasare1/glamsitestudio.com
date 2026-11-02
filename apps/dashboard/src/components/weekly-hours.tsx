"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { WEEKDAYS } from "@glamsite/shared/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { WeeklySlot } from "@/lib/weekly-hours";

export type Day = { open: boolean; slots: { start: string; end: string }[] };

export function daysFromSlots(slots: WeeklySlot[], fallback = { start: "09:00", end: "18:00" }): Day[] {
  return WEEKDAYS.map((day) => {
    const own = slots
      .filter((slot) => slot.weekday === day.value)
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((slot) => ({ start: slot.start, end: slot.end }));
    return { open: own.length > 0, slots: own.length ? own : [{ ...fallback }] };
  });
}

export function slotsFromDays(days: Day[]): WeeklySlot[] {
  return days.flatMap((day, weekday) => (day.open ? day.slots.map((slot) => ({ weekday, ...slot })) : []));
}

/**
 * Seven days, each on or off with up to three time ranges. Used for opening
 * hours and for each team member's working hours.
 */
export function WeeklyHoursFields({
  days,
  onChange,
  words = { start: "Opens", end: "Closes", off: "Closed" },
}: {
  days: Day[];
  onChange: (days: Day[]) => void;
  words?: { start: string; end: string; off: string };
}) {
  function update(index: number, next: Day) {
    onChange(days.map((day, i) => (i === index ? next : day)));
  }

  function copyToWeekdays(index: number) {
    const source = days[index];
    onChange(days.map((day, i) => (i <= 4 ? { open: source.open, slots: source.slots.map((s) => ({ ...s })) } : day)));
  }

  return (
    <ul className="divide-y divide-black/5">
      {days.map((day, index) => (
        <li key={WEEKDAYS[index].value} className="flex flex-wrap items-start gap-4 py-4">
          <label className="flex w-36 items-center gap-3 pt-1.5 text-sm font-medium">
            <Switch checked={day.open} onCheckedChange={(open) => update(index, { ...day, open })} />
            {WEEKDAYS[index].label}
          </label>
          {day.open ? (
            <div className="grid flex-1 gap-2">
              {day.slots.map((slot, slotIndex) => (
                <div key={slotIndex} className="flex items-center gap-2">
                  <Input
                    type="time"
                    aria-label={`${WEEKDAYS[index].label} ${words.start.toLowerCase()}`}
                    value={slot.start}
                    className="w-32"
                    onChange={(event) =>
                      update(index, {
                        ...day,
                        slots: day.slots.map((s, i) => (i === slotIndex ? { ...s, start: event.target.value } : s)),
                      })
                    }
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    aria-label={`${WEEKDAYS[index].label} ${words.end.toLowerCase()}`}
                    value={slot.end}
                    className="w-32"
                    onChange={(event) =>
                      update(index, {
                        ...day,
                        slots: day.slots.map((s, i) => (i === slotIndex ? { ...s, end: event.target.value } : s)),
                      })
                    }
                  />
                  {day.slots.length > 1 ? (
                    <Button variant="ghost" size="icon-sm" aria-label="Remove time slot"
                      onClick={() => update(index, { ...day, slots: day.slots.filter((_, i) => i !== slotIndex) })}>
                      <XIcon />
                    </Button>
                  ) : null}
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                {day.slots.length < 3 ? (
                  <Button variant="ghost" size="sm"
                    onClick={() => {
                      const last = day.slots[day.slots.length - 1];
                      update(index, { ...day, slots: [...day.slots, { start: last?.end ?? "13:00", end: "18:00" }] });
                    }}>
                    <PlusIcon /> Add time slot
                  </Button>
                ) : null}
                {index === 0 ? (
                  <Button variant="ghost" size="sm" onClick={() => copyToWeekdays(0)}>
                    Copy to Tuesday–Friday
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="pt-1.5 text-sm text-muted-foreground">{words.off}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
