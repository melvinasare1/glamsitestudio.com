"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { WEEKDAYS } from "@glamsite/shared/format";
import type { OpeningHours } from "@glamsite/shared/types";
import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAction } from "@/lib/use-action";
import { saveHours, type HoursSlot } from "./actions";

type Day = { open: boolean; slots: { opensAt: string; closesAt: string }[] };

function initialDays(hours: OpeningHours[]): Day[] {
  return WEEKDAYS.map((day) => {
    const slots = hours
      .filter((row) => row.weekday === day.value)
      .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
      .map((row) => ({ opensAt: row.opensAt, closesAt: row.closesAt }));
    return { open: slots.length > 0, slots: slots.length ? slots : [{ opensAt: "09:00", closesAt: "18:00" }] };
  });
}

export function HoursEditor({ hours }: { hours: OpeningHours[] }) {
  const { pending, run } = useAction();
  const [days, setDays] = useState<Day[]>(() => initialDays(hours));
  const [dirty, setDirty] = useState(false);

  function update(index: number, next: Day) {
    setDays((prev) => prev.map((day, i) => (i === index ? next : day)));
    setDirty(true);
  }

  function copyToWeekdays(index: number) {
    const source = days[index];
    setDays((prev) => prev.map((day, i) => (i <= 4 ? { open: source.open, slots: source.slots.map((s) => ({ ...s })) } : day)));
    setDirty(true);
  }

  function onSave() {
    const slots: HoursSlot[] = days.flatMap((day, weekday) =>
      day.open ? day.slots.map((slot) => ({ weekday, opensAt: slot.opensAt, closesAt: slot.closesAt })) : []
    );
    run(() => saveHours(slots), "Opening hours saved", () => setDirty(false));
  }

  return (
    <Panel title="Weekly hours" description="Shown on your site. Add a second time slot for a lunch break or split day.">
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
                      aria-label={`${WEEKDAYS[index].label} opens`}
                      value={slot.opensAt}
                      className="w-32"
                      onChange={(event) =>
                        update(index, {
                          ...day,
                          slots: day.slots.map((s, i) => (i === slotIndex ? { ...s, opensAt: event.target.value } : s)),
                        })
                      }
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      aria-label={`${WEEKDAYS[index].label} closes`}
                      value={slot.closesAt}
                      className="w-32"
                      onChange={(event) =>
                        update(index, {
                          ...day,
                          slots: day.slots.map((s, i) => (i === slotIndex ? { ...s, closesAt: event.target.value } : s)),
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
                        update(index, { ...day, slots: [...day.slots, { opensAt: last?.closesAt ?? "13:00", closesAt: "18:00" }] });
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
              <p className="pt-1.5 text-sm text-muted-foreground">Closed</p>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-black/5 pt-5">
        <Button size="lg" onClick={onSave} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save hours"}
        </Button>
      </div>
    </Panel>
  );
}
