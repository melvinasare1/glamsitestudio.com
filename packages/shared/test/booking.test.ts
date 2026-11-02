// Unit tests for the availability engine. Run with `npm run test:unit`.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  addDays,
  availableSlots,
  canClientCancel,
  formatClock,
  pickStaff,
  staffForService,
  startOfWeek,
  weekdayOf,
  weeklyBlocksFor,
  zonedTimeToInstant,
  type AvailabilityInput,
} from "../src/booking.ts";

const LONDON = "Europe/London";
// Tuesday 3 Nov 2026, 08:00 in London (GMT, so 08:00Z). Tuesday is weekday 1.
const NOW = new Date("2026-11-03T08:00:00Z");
const TUE = "2026-11-03";

function input(overrides: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    timeZone: LONDON,
    rules: { slotIntervalMinutes: 60, minNoticeMinutes: 0, maxAdvanceDays: 60 },
    service: { durationMinutes: 60, bufferMinutes: 0 },
    staff: [{ staffId: "ama", blocks: [{ weekday: 1, start: "09:00", end: "13:00" }] }],
    busy: [],
    from: TUE,
    to: TUE,
    now: NOW,
    ...overrides,
  };
}

const times = (slots: { time: string }[]) => slots.map((slot) => slot.time).join(",");

test("calendar helpers", () => {
  assert.equal(weekdayOf("2026-11-02"), 0); // Monday
  assert.equal(weekdayOf("2026-11-08"), 6); // Sunday
  assert.equal(startOfWeek("2026-11-05"), "2026-11-02");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("wall-clock times convert across daylight saving", () => {
  // London: 09:00 in summer is 08:00Z, in winter 09:00Z.
  assert.equal(zonedTimeToInstant("2026-07-01", 9 * 60, LONDON).toISOString(), "2026-07-01T08:00:00.000Z");
  assert.equal(zonedTimeToInstant("2026-11-03", 9 * 60, LONDON).toISOString(), "2026-11-03T09:00:00.000Z");
  // Accra has no daylight saving; New York is behind UTC.
  assert.equal(zonedTimeToInstant("2026-07-01", 9 * 60, "Africa/Accra").toISOString(), "2026-07-01T09:00:00.000Z");
  assert.equal(zonedTimeToInstant("2026-07-01", 9 * 60, "America/New_York").toISOString(), "2026-07-01T13:00:00.000Z");
  assert.equal(formatClock("2026-07-01T13:30:00Z", "America/New_York"), "9:30am");
});

test("offers every interval that fits before the end of the shift", () => {
  // Tuesday is weekday 1.
  const slots = availableSlots(input({ from: "2026-11-03", to: "2026-11-03" }));
  assert.equal(times(slots), "09:00,10:00,11:00,12:00");
  assert.equal(slots[0].startsAt, "2026-11-03T09:00:00.000Z");
  assert.equal(slots[0].endsAt, "2026-11-03T10:00:00.000Z");
  assert.deepEqual(slots[0].staffIds, ["ama"]);
});

test("long services stop where they would run past the shift", () => {
  const slots = availableSlots(input({ service: { durationMinutes: 150, bufferMinutes: 0 }, rules: { slotIntervalMinutes: 30, minNoticeMinutes: 0, maxAdvanceDays: 60 } }));
  assert.equal(times(slots), "09:00,09:30,10:00,10:30");
});

test("existing appointments and the new appointment's buffer block times", () => {
  const busy = [{ staffId: "ama", startsAt: "2026-11-03T11:00:00Z", endsAt: "2026-11-03T12:00:00Z" }];
  assert.equal(times(availableSlots(input({ busy }))), "09:00,10:00,12:00");
  // A 15 minute clean-up after each appointment means 10:00 would run into 11:00.
  const withBuffer = availableSlots(input({ busy, service: { durationMinutes: 60, bufferMinutes: 15 } }));
  assert.equal(times(withBuffer), "09:00,12:00");
});

test("business-wide closures block everyone; personal time off only that person", () => {
  const staff = [
    { staffId: "ama", blocks: [{ weekday: 1, start: "09:00", end: "12:00" }] },
    { staffId: "bea", blocks: [{ weekday: 1, start: "09:00", end: "12:00" }] },
  ];
  const off = [{ staffId: "ama", startsAt: "2026-11-03T09:00:00Z", endsAt: "2026-11-03T10:00:00Z" }];
  const slots = availableSlots(input({ staff, busy: off }));
  assert.deepEqual(slots.map((s) => s.staffIds.join("+")), ["bea", "ama+bea", "ama+bea"]);

  const closed = [{ staffId: null, startsAt: "2026-11-03T00:00:00Z", endsAt: "2026-11-04T00:00:00Z" }];
  assert.equal(availableSlots(input({ staff, busy: closed })).length, 0);
});

test("minimum notice and the advance-booking limit", () => {
  // Now is 08:00; 2 hours' notice means 10:00 is the first time.
  assert.equal(times(availableSlots(input({ rules: { slotIntervalMinutes: 60, minNoticeMinutes: 120, maxAdvanceDays: 60 } }))), "10:00,11:00,12:00");
  // Past dates are never offered.
  assert.equal(availableSlots(input({ from: "2026-11-02", to: "2026-11-02", staff: [{ staffId: "ama", blocks: [{ weekday: 0, start: "09:00", end: "17:00" }] }] })).length, 0);
  // Tuesday next week is 7 days out; a 5-day limit hides it.
  const nextWeek = input({ from: "2026-11-10", to: "2026-11-10" });
  assert.equal(availableSlots(nextWeek).length, 4);
  assert.equal(availableSlots({ ...nextWeek, rules: { ...nextWeek.rules, maxAdvanceDays: 5 } }).length, 0);
});

test("split shifts, and slots only on the right weekday", () => {
  const staff = [{ staffId: "ama", blocks: [
    { weekday: 1, start: "09:00", end: "11:00" },
    { weekday: 1, start: "14:00", end: "16:00" },
    { weekday: 2, start: "09:00", end: "17:00" },
  ] }];
  assert.equal(times(availableSlots(input({ staff }))), "09:00,10:00,14:00,15:00");
});

test("choosing staff and who can do a service", () => {
  assert.equal(pickStaff(["ama", "bea"], { ama: 3, bea: 1 }), "bea");
  assert.equal(pickStaff(["ama", "bea"], {}), "ama");
  assert.equal(pickStaff([], {}), null);

  const team = [
    { id: "ama", isBookable: true, serviceIds: ["cut"] },
    { id: "bea", isBookable: true, serviceIds: [] },
    { id: "cee", isBookable: false, serviceIds: ["cut"] },
  ];
  assert.deepEqual(staffForService(team, "cut").map((p) => p.id), ["ama"]);
  // Nobody linked to "braids" yet: every bookable person can take it.
  assert.deepEqual(staffForService(team, "braids").map((p) => p.id), ["ama", "bea"]);
});

test("staff without their own hours fall back to opening hours", () => {
  const opening = [{ weekday: 1, opensAt: "10:00", closesAt: "18:00" }];
  const own = [{ staffId: "ama", weekday: 1, startsAt: "12:00", endsAt: "16:00" }];
  assert.deepEqual(weeklyBlocksFor("ama", own, opening), [{ weekday: 1, start: "12:00", end: "16:00" }]);
  assert.deepEqual(weeklyBlocksFor("bea", own, opening), [{ weekday: 1, start: "10:00", end: "18:00" }]);
});

test("clients can cancel online only before the cut-off", () => {
  const appt = { status: "confirmed", startsAt: "2026-11-04T09:00:00Z" };
  assert.equal(canClientCancel(appt, { cancellationNoticeHours: 24 }, NOW), true);
  assert.equal(canClientCancel(appt, { cancellationNoticeHours: 48 }, NOW), false);
  assert.equal(canClientCancel({ ...appt, status: "cancelled" }, { cancellationNoticeHours: 0 }, NOW), false);
});
