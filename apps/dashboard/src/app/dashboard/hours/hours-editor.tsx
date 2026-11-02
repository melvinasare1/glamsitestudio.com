"use client";

import { useState } from "react";
import type { OpeningHours } from "@glamsite/shared/types";
import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { WeeklyHoursFields, daysFromSlots, slotsFromDays, type Day } from "@/components/weekly-hours";
import { useAction } from "@/lib/use-action";
import { saveHours } from "./actions";

export function HoursEditor({ hours }: { hours: OpeningHours[] }) {
  const { pending, run } = useAction();
  const [days, setDays] = useState<Day[]>(() =>
    daysFromSlots(hours.map((row) => ({ weekday: row.weekday, start: row.opensAt, end: row.closesAt })))
  );
  const [dirty, setDirty] = useState(false);

  function onSave() {
    const slots = slotsFromDays(days).map((slot) => ({ weekday: slot.weekday, opensAt: slot.start, closesAt: slot.end }));
    run(() => saveHours(slots), "Opening hours saved", () => setDirty(false));
  }

  return (
    <Panel title="Weekly hours" description="Shown on your site. Add a second time slot for a lunch break or split day.">
      <WeeklyHoursFields
        days={days}
        onChange={(next) => {
          setDays(next);
          setDirty(true);
        }}
      />
      <div className="mt-4 border-t border-black/5 pt-5">
        <Button size="lg" onClick={onSave} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save hours"}
        </Button>
      </div>
    </Panel>
  );
}
