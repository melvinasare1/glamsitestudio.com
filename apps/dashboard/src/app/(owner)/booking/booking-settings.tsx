"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { formatClock, formatDayShort, todayIn, zonedParts, type BookingRules } from "@glamsite/shared/booking";
import { WEEKDAYS, formatTime } from "@glamsite/shared/format";
import type { OpeningHours, StaffMember, StaffWorkingHours, TimeOff } from "@glamsite/shared/types";
import { EmptyState, Field, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { WeeklyHoursFields, daysFromSlots, slotsFromDays, type Day } from "@/components/weekly-hours";
import { useAction } from "@/lib/use-action";
import {
  addTimeOff,
  deleteTimeOff,
  saveBookingRules,
  saveStaffHours,
  type RulesInput,
  type TimeOffInput,
} from "./actions";

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

const INTERVALS = [
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "On the hour" },
  { value: 10, label: "Every 10 minutes" },
  { value: 20, label: "Every 20 minutes" },
  { value: 5, label: "Every 5 minutes" },
];
const NOTICE = [
  { value: 0, label: "No notice needed" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
  { value: 720, label: "12 hours" },
  { value: 1440, label: "1 day" },
  { value: 2880, label: "2 days" },
];
const ADVANCE = [
  { value: 14, label: "2 weeks" },
  { value: 30, label: "1 month" },
  { value: 60, label: "2 months" },
  { value: 90, label: "3 months" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
];
const CANCEL = [
  { value: 0, label: "Any time before" },
  { value: 2, label: "Up to 2 hours before" },
  { value: 12, label: "Up to 12 hours before" },
  { value: 24, label: "Up to 24 hours before" },
  { value: 48, label: "Up to 48 hours before" },
  { value: 72, label: "Up to 72 hours before" },
];

/** Keep an owner's existing value in the list even if it isn't one of the presets. */
function withCurrent(options: { value: number; label: string }[], current: number, label: (v: number) => string) {
  return options.some((option) => option.value === current) ? options : [...options, { value: current, label: label(current) }];
}

function NumberSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RulesForm({ rules }: { rules: BookingRules }) {
  const { pending, run } = useAction();
  const [form, setForm] = useState<RulesInput>({
    slotIntervalMinutes: rules.slotIntervalMinutes,
    minNoticeMinutes: rules.minNoticeMinutes,
    maxAdvanceDays: rules.maxAdvanceDays,
    cancellationNoticeHours: rules.cancellationNoticeHours,
    autoConfirm: rules.autoConfirm,
    policyText: rules.policyText,
  });
  const set = <K extends keyof RulesInput>(key: K, value: RulesInput[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Panel title="Booking rules" description="When clients can book and cancel online.">
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => saveBookingRules(form), "Booking rules saved");
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="r-interval" label="Times start" description="How often appointment times are offered.">
            <NumberSelect id="r-interval" value={form.slotIntervalMinutes} options={INTERVALS}
              onChange={(value) => set("slotIntervalMinutes", value)} />
          </Field>
          <Field id="r-notice" label="Notice you need" description="The soonest a client can book.">
            <NumberSelect id="r-notice" value={form.minNoticeMinutes}
              options={withCurrent(NOTICE, form.minNoticeMinutes, (v) => `${v} minutes`)}
              onChange={(value) => set("minNoticeMinutes", value)} />
          </Field>
          <Field id="r-advance" label="Book up to" description="How far ahead clients can book.">
            <NumberSelect id="r-advance" value={form.maxAdvanceDays}
              options={withCurrent(ADVANCE, form.maxAdvanceDays, (v) => `${v} days`)}
              onChange={(value) => set("maxAdvanceDays", value)} />
          </Field>
          <Field id="r-cancel" label="Clients can cancel online" description="After this, they need to contact you.">
            <NumberSelect id="r-cancel" value={form.cancellationNoticeHours}
              options={withCurrent(CANCEL, form.cancellationNoticeHours, (v) => `Up to ${v} hours before`)}
              onChange={(value) => set("cancellationNoticeHours", value)} />
          </Field>
        </div>
        <label className="flex items-start justify-between gap-4 rounded-xl border border-black/8 p-4 text-sm">
          <span>
            <span className="block font-medium">Confirm bookings automatically</span>
            <span className="mt-0.5 block text-muted-foreground">
              Turn off to review each booking first. Clients see &ldquo;Request sent&rdquo; until you confirm it in Appointments.
            </span>
          </span>
          <Switch checked={form.autoConfirm} onCheckedChange={(checked) => set("autoConfirm", checked)} />
        </label>
        <Field id="r-policy" label="Booking policy" description="Optional. Clients must tick that they agree before booking.">
          <Textarea id="r-policy" rows={4} maxLength={2000} value={form.policyText}
            placeholder="e.g. Please arrive 10 minutes early. Late arrivals may need to be shortened or rebooked."
            onChange={(event) => set("policyText", event.target.value)} />
        </Field>
        <div>
          <Button type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : "Save rules"}</Button>
        </div>
      </form>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Team hours
// ---------------------------------------------------------------------------

/** "Mon–Fri 9am – 5pm, Sat 10am – 4pm" */
function summarise(slots: { weekday: number; start: string; end: string }[]): string {
  if (!slots.length) return "Not working";
  const byDay = WEEKDAYS.map((day) =>
    slots
      .filter((slot) => slot.weekday === day.value)
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((slot) => `${formatTime(slot.start)} – ${formatTime(slot.end)}`)
      .join(", ")
  );
  const parts: string[] = [];
  let i = 0;
  while (i < 7) {
    if (!byDay[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < 7 && byDay[j + 1] === byDay[i]) j++;
    const days = i === j ? WEEKDAYS[i].short : `${WEEKDAYS[i].short}–${WEEKDAYS[j].short}`;
    parts.push(`${days} ${byDay[i]}`);
    i = j + 1;
  }
  return parts.join(" · ");
}

export function StaffHours({
  staff,
  workingHours,
  openingHours,
}: {
  staff: StaffMember[];
  workingHours: StaffWorkingHours[];
  openingHours: OpeningHours[];
}) {
  const { pending, run } = useAction();
  const [editing, setEditing] = useState<{ person: StaffMember; days: Day[] } | null>(null);
  const bookable = staff.filter((person) => person.isBookable);
  const opening = openingHours.map((row) => ({ weekday: row.weekday, start: row.opensAt, end: row.closesAt }));

  return (
    <Panel
      title="When each person works"
      description="Clients can only book times when someone is working. Until you set someone's hours, they follow your opening hours."
    >
      {bookable.length === 0 ? (
        <EmptyState title="Nobody can be booked yet">
          Add yourself or your team on the <a className="font-medium underline" href="/team">Team page</a>, with
          &ldquo;Clients can book with them online&rdquo; switched on.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
          {bookable.map((person) => {
            const own = workingHours
              .filter((row) => row.staffId === person.id)
              .map((row) => ({ weekday: row.weekday, start: row.startsAt, end: row.endsAt }));
            return (
              <li key={person.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {person.name}
                    {own.length ? null : <Badge variant="outline">Opening hours</Badge>}
                  </p>
                  <p className="text-sm text-muted-foreground">{summarise(own.length ? own : opening)}</p>
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => setEditing({ person, days: daysFromSlots(own.length ? own : opening) })}>
                  Set hours
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {editing ? (
            <div className="flex h-full flex-col">
              <SheetHeader>
                <SheetTitle>{editing.person.name}&rsquo;s working hours</SheetTitle>
                <SheetDescription>Times clients can book with {editing.person.name}. Add a second slot for a break.</SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <WeeklyHoursFields
                  days={editing.days}
                  words={{ start: "Starts", end: "Finishes", off: "Not working" }}
                  onChange={(days) => setEditing({ ...editing, days })}
                />
              </div>
              <SheetFooter className="mt-auto">
                <Button size="lg" disabled={pending}
                  onClick={() =>
                    run(() => saveStaffHours(editing.person.id, slotsFromDays(editing.days)), "Working hours saved", () =>
                      setEditing(null)
                    )
                  }>
                  {pending ? "Saving…" : "Save hours"}
                </Button>
                {workingHours.some((row) => row.staffId === editing.person.id) ? (
                  <Button size="lg" variant="ghost" disabled={pending}
                    onClick={() =>
                      run(() => saveStaffHours(editing.person.id, []), "Now following opening hours", () => setEditing(null))
                    }>
                    Use opening hours instead
                  </Button>
                ) : null}
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Time off
// ---------------------------------------------------------------------------

function describeTimeOff(item: TimeOff, timeZone: string): string {
  const start = zonedParts(new Date(item.startsAt), timeZone);
  // Ends at midnight → the day before is the last day off.
  const endInstant = new Date(new Date(item.endsAt).getTime() - 1);
  const end = zonedParts(endInstant, timeZone);
  const wholeDays = start.hm === "00:00" && zonedParts(new Date(item.endsAt), timeZone).hm === "00:00";
  if (wholeDays) {
    return start.ymd === end.ymd ? formatDayShort(start.ymd) : `${formatDayShort(start.ymd)} – ${formatDayShort(end.ymd)}`;
  }
  return `${formatDayShort(start.ymd)}, ${formatClock(item.startsAt, timeZone)} – ${formatClock(item.endsAt, timeZone)}`;
}

export function TimeOffPanel({
  timeOff,
  staff,
  timeZone,
}: {
  timeOff: TimeOff[];
  staff: StaffMember[];
  timeZone: string;
}) {
  const { pending, run } = useAction();
  const today = todayIn(timeZone);
  const blank = (): TimeOffInput => ({
    staffId: null,
    allDay: true,
    fromDate: today,
    toDate: today,
    startTime: "12:00",
    endTime: "14:00",
    reason: "",
  });
  const [draft, setDraft] = useState<TimeOffInput | null>(null);
  const set = <K extends keyof TimeOffInput>(key: K, value: TimeOffInput[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  const nameOf = (id: string | null) => (id ? staff.find((person) => person.id === id)?.name ?? "Team member" : "Everyone (closed)");

  return (
    <Panel
      title="Time off and closures"
      description="Holidays, training days, bank holidays. Nobody can book these times online."
      actions={
        <Button onClick={() => setDraft(blank())}>
          <PlusIcon /> Add time off
        </Button>
      }
    >
      {timeOff.length === 0 ? (
        <EmptyState title="No time off coming up" />
      ) : (
        <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
          {timeOff.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{describeTimeOff(item, timeZone)}</p>
                <p className="text-sm text-muted-foreground">
                  {nameOf(item.staffId)}
                  {item.reason ? ` · ${item.reason}` : ""}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Remove time off" disabled={pending}
                onClick={() => run(() => deleteTimeOff(item.id), "Time off removed")}>
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {draft ? (
            <form
              className="flex h-full flex-col"
              onSubmit={(event) => {
                event.preventDefault();
                run(() => addTimeOff(draft), "Time off added", () => setDraft(null));
              }}
            >
              <SheetHeader>
                <SheetTitle>Add time off</SheetTitle>
                <SheetDescription>Appointments already booked in this time stay booked. Move or cancel them in Appointments.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-5 px-4">
                <Field id="t-who" label="Who">
                  <Select value={draft.staffId ?? "all"} onValueChange={(value) => set("staffId", value === "all" ? null : value)}>
                    <SelectTrigger id="t-who" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone (the business is closed)</SelectItem>
                      {staff.map((person) => (
                        <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <label className="flex items-center justify-between gap-4 text-sm">
                  Whole days
                  <Switch checked={draft.allDay} onCheckedChange={(checked) => set("allDay", checked)} />
                </label>
                {draft.allDay ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Field id="t-from" label="From">
                      <Input id="t-from" type="date" required value={draft.fromDate}
                        onChange={(event) => setDraft({ ...draft, fromDate: event.target.value, toDate: draft.toDate < event.target.value ? event.target.value : draft.toDate })} />
                    </Field>
                    <Field id="t-to" label="Until (including)">
                      <Input id="t-to" type="date" required min={draft.fromDate} value={draft.toDate}
                        onChange={(event) => set("toDate", event.target.value)} />
                    </Field>
                  </div>
                ) : (
                  <>
                    <Field id="t-day" label="Day">
                      <Input id="t-day" type="date" required value={draft.fromDate} onChange={(event) => set("fromDate", event.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field id="t-start" label="From">
                        <Input id="t-start" type="time" required value={draft.startTime} onChange={(event) => set("startTime", event.target.value)} />
                      </Field>
                      <Field id="t-end" label="Until">
                        <Input id="t-end" type="time" required value={draft.endTime} onChange={(event) => set("endTime", event.target.value)} />
                      </Field>
                    </div>
                  </>
                )}
                <Field id="t-reason" label="Note" description="Optional, only you see it.">
                  <Input id="t-reason" maxLength={200} value={draft.reason} placeholder="e.g. Holiday"
                    onChange={(event) => set("reason", event.target.value)} />
                </Field>
              </div>
              <SheetFooter>
                <Button type="submit" size="lg" disabled={pending}>{pending ? "Adding…" : "Add time off"}</Button>
              </SheetFooter>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>
    </Panel>
  );
}
