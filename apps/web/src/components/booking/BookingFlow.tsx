"use client";

/* eslint-disable @next/next/no-img-element -- team photos come from storage at unknown sizes */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, depositAmountCents, formatDayLong, formatDayShort, staffForService, type PaymentPolicy } from "@glamsite/shared/booking";
import { formatDuration, formatMoney, formatServicePrice, formatTime, groupServices } from "@glamsite/shared/format";
import type { Service, ServiceCategory } from "@glamsite/shared/types";

type Person = {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  isBookable: boolean;
  serviceIds: string[];
};

type SlotOption = { startsAt: string; date: string; time: string };

type Props = {
  slug: string;
  businessName: string;
  currency: string;
  categories: ServiceCategory[];
  services: Service[];
  staff: Person[];
  policyText: string;
  cancellationNoticeHours: number;
  autoConfirm: boolean;
  paymentPolicy: PaymentPolicy;
  depositFixedCents: number | null;
  homeHref: string;
  /** Path the manage token is appended to, e.g. "/appointment/". */
  manageBase: string;
  initialServiceId?: string;
  initialStaffId?: string;
  bookingHeading: string;
};

/** How many days of times we ask for at once. */
const PAGE_DAYS = 28;

type Details = { name: string; email: string; phone: string; notes: string; agreed: boolean; website: string };

type Done = { token: string; status: "pending" | "confirmed"; slot: SlotOption; serviceId: string; staffName: string | null };

function partOfDay(time: string): "Morning" | "Afternoon" | "Evening" {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

/** A calendar file for the confirmed appointment. */
function icsHref(title: string, location: string, startsAt: string, minutes: number, url: string): string {
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + minutes * 60_000);
  const escape = (value: string) => value.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Glam Site Studios//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${stamp(start)}-${Math.random().toString(36).slice(2)}@glamsitestudio.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(title)}`,
    `LOCATION:${escape(location)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

export function BookingFlow(props: Props) {
  const { services, staff, currency } = props;

  const [serviceId, setServiceId] = useState<string | null>(() =>
    services.some((service) => service.id === props.initialServiceId) ? props.initialServiceId! : null
  );
  const service = services.find((item) => item.id === serviceId) ?? null;

  const team = useMemo(() => (service ? staffForService(staff, service.id) : []), [staff, service]);
  // "any", a person's id, or null while the client hasn't chosen.
  const [staffChoice, setStaffChoice] = useState<string | null>(() =>
    props.initialStaffId && staff.some((person) => person.id === props.initialStaffId) ? props.initialStaffId : null
  );
  const askStaff = team.length > 1;
  const effectiveStaff = !service ? null : askStaff ? staffChoice : team[0]?.id ?? null;
  const chosenPerson = staff.find((person) => person.id === effectiveStaff) ?? null;

  const depositCents = service ? depositAmountCents(props.paymentPolicy, service.priceCents, props.depositFixedCents) : null;
  const paymentNotice =
    depositCents == null
      ? null
      : props.paymentPolicy === "full"
        ? `Full payment of ${formatMoney(depositCents, currency)} is required. ${props.businessName} will contact you to arrange payment.`
        : `A ${formatMoney(depositCents, currency)} deposit is required. ${props.businessName} will contact you to collect it.`;

  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [range, setRange] = useState<{ first: string; loadedTo: string; last: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotOption | null>(null);
  /** The first day of the 7-day window shown in step 3. */
  const [weekStart, setWeekStart] = useState<string | null>(null);

  const [details, setDetails] = useState<Details>({ name: "", email: "", phone: "", notes: "", agreed: false, website: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const requestId = useRef(0);
  const stepRefs = useRef<Record<number, HTMLElement | null>>({});

  const step = !service ? 1 : askStaff && !staffChoice ? 2 : !slot ? 3 : 4;

  // Keep an invalid pre-selected person (from a link) from sticking when the service changes.
  useEffect(() => {
    if (staffChoice && staffChoice !== "any" && !team.some((person) => person.id === staffChoice)) setStaffChoice(null);
  }, [team, staffChoice]);

  const fetchSlots = useCallback(
    async (from: string, append: boolean) => {
      if (!service || !effectiveStaff) return;
      const id = ++requestId.current;
      setLoading(true);
      setLoadError(null);
      const params = new URLSearchParams({
        site: props.slug,
        service: service.id,
        staff: effectiveStaff,
        from,
        to: addDays(from, PAGE_DAYS - 1),
      });
      try {
        const response = await fetch(`/api/booking/slots?${params}`, { cache: "no-store" });
        const body = (await response.json()) as { slots?: SlotOption[]; first?: string; last?: string; error?: string };
        if (id !== requestId.current) return;
        if (!response.ok || !body.slots || !body.first || !body.last) {
          setLoadError(body.error ?? "Couldn't load times. Please try again.");
          return;
        }
        const loadedTo = addDays(from, PAGE_DAYS - 1);
        setRange((prev) => ({
          first: append && prev ? prev.first : body.first!,
          loadedTo: loadedTo < body.last! ? loadedTo : body.last!,
          last: body.last!,
        }));
        setSlots((prev) => (append ? [...prev, ...body.slots!] : body.slots!));
        if (!append) setDay(body.slots[0]?.date ?? null);
        else setDay((prev) => prev ?? body.slots![0]?.date ?? null);
      } catch {
        if (id === requestId.current) setLoadError("Couldn't load times. Check your connection and try again.");
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [props.slug, service, effectiveStaff]
  );

  // New service or person: start again from today.
  useEffect(() => {
    setSlots([]);
    setRange(null);
    setDay(null);
    setSlot(null);
    setWeekStart(null);
    if (service && effectiveStaff) void fetchSlots(new Date().toISOString().slice(0, 10), false);
  }, [service, effectiveStaff, fetchSlots]);

  // The first page of slots has arrived: show the week it starts in.
  useEffect(() => {
    if (range && weekStart === null) setWeekStart(range.first);
  }, [range, weekStart]);

  // Bring the step the client is on into view on small screens.
  useEffect(() => {
    if (done) return;
    const el = stepRefs.current[step];
    if (el && window.matchMedia("(max-width: 1023px)").matches && step > 1) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step, done]);

  const weekDays = useMemo(
    () => (weekStart ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : []),
    [weekStart]
  );
  const openDays = useMemo(() => new Set(slots.map((item) => item.date)), [slots]);
  const daySlots = slots.filter((item) => item.date === day);

  // Keep the selected day within the visible week, defaulting to its first open day.
  useEffect(() => {
    if (!weekStart) return;
    setDay((prev) => (prev && weekDays.includes(prev) ? prev : weekDays.find((d) => openDays.has(d)) ?? null));
  }, [weekStart, weekDays, openDays]);

  const canGoPrevWeek = Boolean(range && weekStart && weekStart > range.first);
  const canGoNextWeek = Boolean(range && weekStart && addDays(weekStart, 7) <= range.last);

  function prevWeek() {
    if (!range || !weekStart) return;
    const target = addDays(weekStart, -7);
    setWeekStart(target < range.first ? range.first : target);
  }

  async function nextWeek() {
    if (!range || !weekStart) return;
    const target = addDays(weekStart, 7);
    if (target > range.last) return;
    const weekEnd = addDays(target, 6);
    if (weekEnd > range.loadedTo && range.loadedTo < range.last) {
      await fetchSlots(addDays(range.loadedTo, 1), true);
    }
    setWeekStart(target);
  }

  async function book(event: React.FormEvent) {
    event.preventDefault();
    if (!service || !slot || !effectiveStaff) return;
    if (props.policyText.trim() && !details.agreed) {
      setFormError("Please confirm you've read the booking policy.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch("/api/booking/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: props.slug,
          serviceId: service.id,
          staffId: effectiveStaff === "any" ? null : effectiveStaff,
          startsAt: slot.startsAt,
          name: details.name,
          email: details.email,
          phone: details.phone,
          notes: details.notes,
          website: details.website,
        }),
      });
      const body = (await response.json()) as { token?: string; status?: "pending" | "confirmed"; error?: string; code?: string };
      if (response.ok && body.token && body.status) {
        setDone({ token: body.token, status: body.status, slot, serviceId: service.id, staffName: chosenPerson?.name ?? null });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (body.code === "slot_taken") {
        setSlot(null);
        setFormError(null);
        setLoadError(body.error ?? "That time is no longer available. Please choose another.");
        void fetchSlots(range?.first ?? new Date().toISOString().slice(0, 10), false);
        return;
      }
      setFormError(body.error ?? "Couldn't book. Please try again.");
    } catch {
      setFormError("Couldn't book. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const bookedService = services.find((item) => item.id === done.serviceId)!;
    const manageHref = `${props.manageBase}${done.token}`;
    const manageUrl = typeof window === "undefined" ? manageHref : new URL(manageHref, window.location.origin).toString();
    return (
      <section className="mx-auto max-w-xl py-6 md:py-12" aria-live="polite">
        <span className="flex size-14 items-center justify-center rounded-full bg-[var(--brand)] text-2xl text-[var(--brand-ink)]" aria-hidden>
          ✓
        </span>
        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-4xl leading-tight md:text-5xl">
          {done.status === "confirmed" ? "You're booked in" : "Request sent"}
        </h1>
        <p className="mt-4 text-lg text-[#4a4145]">
          {done.status === "confirmed"
            ? `We've emailed your confirmation to ${details.email}.`
            : `${props.businessName} will confirm your appointment shortly. We'll email ${details.email} when they do.`}
        </p>
        <dl className="mt-8 divide-y divide-[#ece6e3] border-y border-[#ece6e3] text-[15px]">
          <Row label="When">
            {formatDayLong(done.slot.date)}, {formatTime(done.slot.time)}
          </Row>
          <Row label="Service">
            {bookedService.name} · {formatDuration(bookedService.durationMinutes)}
          </Row>
          {done.staffName ? <Row label="With">{done.staffName}</Row> : null}
          <Row label="Price">{formatServicePrice(bookedService, currency)}</Row>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={icsHref(
              `${bookedService.name} at ${props.businessName}`,
              props.businessName,
              done.slot.startsAt,
              bookedService.durationMinutes,
              manageUrl
            )}
            download="appointment.ics"
            className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-medium text-[var(--brand-ink)] hover:opacity-90"
          >
            Add to calendar
          </a>
          <a href={manageHref} className="rounded-full border border-[#d9d1cd] px-6 py-3 text-sm font-medium hover:border-[#1f1a1c]">
            View or cancel
          </a>
          <a href={props.homeHref} className="px-2 py-3 text-sm text-[#6e6468] underline-offset-4 hover:underline">
            Back to {props.businessName}
          </a>
        </div>
      </section>
    );
  }

  const groups = groupServices(props.categories, services);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight md:text-5xl">{props.bookingHeading}</h1>

        <ol className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4">
          {/* 1. Service */}
          <Step
            n={1}
            title="Choose a service"
            open={step === 1}
            summary={service ? `${service.name} · ${formatDuration(service.durationMinutes)}` : null}
            onChange={() => {
              setServiceId(null);
              setStaffChoice(null);
            }}
            refCallback={(el) => (stepRefs.current[1] = el)}
          >
            <div className="grid gap-6">
              {groups.map((group) => (
                <div key={group.category?.id ?? "other"}>
                  {groups.length > 1 ? (
                    <h3 className="mb-2 font-[family-name:var(--font-heading)] text-xl">{group.category?.name ?? "Other services"}</h3>
                  ) : null}
                  <ul className="divide-y divide-[#ece6e3] border-y border-[#ece6e3]">
                    {group.services.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setServiceId(item.id);
                            setStaffChoice(null);
                          }}
                          className="group flex w-full items-start justify-between gap-4 py-4 text-left"
                        >
                          <span className="flex min-w-0 items-start gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                            ) : null}
                            <span className="min-w-0">
                              <span className="block font-medium group-hover:underline group-hover:underline-offset-4">{item.name}</span>
                              <span className="mt-0.5 block text-sm text-[#6e6468]">{formatDuration(item.durationMinutes)}</span>
                              {item.description ? (
                                <span className="mt-1 block max-w-prose text-sm text-[#6e6468]">{item.description}</span>
                              ) : null}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-sm font-medium font-tabular">{formatServicePrice(item, currency)}</span>
                            <span className="mt-2 inline-block rounded-full border border-[#d9d1cd] px-3 py-1 text-xs font-medium group-hover:border-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-[var(--brand-ink)]">
                              Select
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Step>

          {/* 2. Who */}
          {service && askStaff ? (
            <Step
              n={2}
              title="Choose who you'd like to see"
              open={step === 2}
              summary={staffChoice === "any" ? "Anyone available" : chosenPerson?.name ?? null}
              onChange={() => setStaffChoice(null)}
              refCallback={(el) => (stepRefs.current[2] = el)}
            >
              <ul className="grid gap-3 sm:grid-cols-2">
                <li>
                  <PersonButton
                    name="Anyone available"
                    detail="Shows the most times"
                    selected={staffChoice === "any"}
                    onClick={() => setStaffChoice("any")}
                  />
                </li>
                {team.map((person) => (
                  <li key={person.id}>
                    <PersonButton
                      name={person.name}
                      detail={person.role}
                      photoUrl={person.photoUrl}
                      selected={staffChoice === person.id}
                      onClick={() => setStaffChoice(person.id)}
                    />
                  </li>
                ))}
              </ul>
            </Step>
          ) : null}

          {/* 3. Time */}
          {service && effectiveStaff ? (
            <Step
              n={askStaff ? 3 : 2}
              title="Pick a time"
              open={step === 3}
              summary={slot ? `${formatDayLong(slot.date)}, ${formatTime(slot.time)}` : null}
              onChange={() => setSlot(null)}
              refCallback={(el) => (stepRefs.current[3] = el)}
            >
              {loadError ? <p className="mb-4 rounded-lg bg-[#fff1f0] px-4 py-3 text-sm text-[#9b1c1c]">{loadError}</p> : null}
              {!range && loading ? <p className="py-6 text-[#6e6468]">Finding free times…</p> : null}
              {range ? (
                <>
                  <div className="flex items-center gap-2 pb-3">
                    <button
                      type="button"
                      aria-label="Previous week"
                      disabled={!canGoPrevWeek}
                      onClick={prevWeek}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#d9d1cd] text-[#4a4145] transition hover:border-[#1f1a1c] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </button>
                    <div className="grid flex-1 grid-cols-7 gap-1.5" role="listbox" aria-label="Day">
                      {weekDays.map((d) => {
                        const open = openDays.has(d);
                        const selected = d === day;
                        const [, , dd] = d.split("-");
                        return (
                          <button
                            key={d}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            aria-label={`${formatDayLong(d)}${open ? "" : ", no times"}`}
                            disabled={!open}
                            onClick={() => setDay(d)}
                            className={`flex flex-col items-center rounded-2xl border py-2.5 transition ${
                              selected
                                ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-ink)]"
                                : open
                                  ? "border-[#d9d1cd] hover:border-[#1f1a1c]"
                                  : "border-transparent text-[#bcb2b6] line-through decoration-1"
                            }`}
                          >
                            <span className="text-[11px]">{formatDayShort(d).split(" ")[0]}</span>
                            <span className="text-lg font-medium font-tabular leading-tight">{Number(dd)}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      aria-label="Next week"
                      disabled={!canGoNextWeek || loading}
                      onClick={() => void nextWeek()}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#d9d1cd] text-[#4a4145] transition hover:border-[#1f1a1c] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  </div>

                  {day ? (
                    <div className="mt-4">
                      <h3 className="font-[family-name:var(--font-heading)] text-xl">{formatDayLong(day)}</h3>
                      {(["Morning", "Afternoon", "Evening"] as const).map((part) => {
                        const times = daySlots.filter((item) => partOfDay(item.time) === part);
                        if (!times.length) return null;
                        return (
                          <div key={part} className="mt-4">
                            <p className="mb-2 text-sm text-[#6e6468]">{part}</p>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                              {times.map((item) => (
                                <button
                                  key={item.startsAt}
                                  type="button"
                                  onClick={() => {
                                    setSlot(item);
                                    setLoadError(null);
                                  }}
                                  className="rounded-xl border border-[#d9d1cd] py-2.5 text-sm font-medium font-tabular hover:border-[var(--brand)] hover:bg-[var(--brand)] hover:text-[var(--brand-ink)]"
                                >
                                  {formatTime(item.time)}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-4 text-[#6e6468]">
                      No free times this week.{" "}
                      {canGoNextWeek ? "Try the next week." : "Please get in touch to book."}
                    </p>
                  )}
                </>
              ) : null}
            </Step>
          ) : null}

          {/* 4. Details */}
          {slot && service ? (
            <Step n={askStaff ? 4 : 3} title="Your details" open={step === 4} summary={null} refCallback={(el) => (stepRefs.current[4] = el)}>
              <form onSubmit={book} className="grid gap-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Full name" autoComplete="name" value={details.name} required
                    onChange={(name) => setDetails((d) => ({ ...d, name }))} />
                  <TextField label="Phone" type="tel" autoComplete="tel" value={details.phone} required
                    onChange={(phone) => setDetails((d) => ({ ...d, phone }))} />
                </div>
                <TextField label="Email" type="email" autoComplete="email" value={details.email} required
                  hint="Your confirmation goes here."
                  onChange={(email) => setDetails((d) => ({ ...d, email }))} />
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Anything they should know? <span className="font-normal text-[#6e6468]">(optional)</span></span>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={details.notes}
                    onChange={(event) => setDetails((d) => ({ ...d, notes: event.target.value }))}
                    className="rounded-xl border border-[#d9d1cd] px-4 py-3 text-base outline-none focus:border-[#1f1a1c]"
                  />
                </label>
                {/* Honeypot: hidden from people, filled in by bots. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="hidden"
                  value={details.website}
                  onChange={(event) => setDetails((d) => ({ ...d, website: event.target.value }))}
                />

                {paymentNotice ? (
                  <p className="rounded-xl bg-[#f7f4f2] px-4 py-3 text-sm text-[#4a4145]">{paymentNotice}</p>
                ) : null}

                {props.policyText.trim() ? (
                  <div className="rounded-xl bg-[#f7f4f2] px-4 py-4 text-sm">
                    <p className="font-medium">Booking policy</p>
                    <p className="mt-1 whitespace-pre-line text-[#4a4145]">{props.policyText.trim()}</p>
                    <label className="mt-3 flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={details.agreed}
                        onChange={(event) => setDetails((d) => ({ ...d, agreed: event.target.checked }))}
                        className="mt-0.5 size-4 accent-[var(--brand)]"
                      />
                      <span>I&apos;ve read and agree to the booking policy</span>
                    </label>
                  </div>
                ) : null}

                <p className="text-sm text-[#6e6468]">
                  {props.cancellationNoticeHours > 0
                    ? `You can cancel online up to ${props.cancellationNoticeHours} hours before your appointment.`
                    : "You can cancel online any time before your appointment."}
                  {props.autoConfirm ? "" : ` ${props.businessName} confirms each booking by email.`}
                </p>

                {formError ? <p className="rounded-lg bg-[#fff1f0] px-4 py-3 text-sm text-[#9b1c1c]" role="alert">{formError}</p> : null}

                <div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-[var(--brand)] px-8 py-4 font-medium text-[var(--brand-ink)] transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? "Booking…" : props.autoConfirm ? "Book appointment" : "Request appointment"}
                  </button>
                </div>
              </form>
            </Step>
          ) : null}
        </ol>
      </div>

      {/* The appointment as it takes shape. */}
      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <Summary service={service} person={staffChoice === "any" ? "Anyone available" : chosenPerson?.name ?? null}
            slot={slot} currency={currency} businessName={props.businessName} paymentNotice={paymentNotice} />
        </div>
      </aside>

      {service ? (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#ece6e3] bg-white/95 px-5 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 text-sm">
            <span className="min-w-0 truncate">
              <span className="font-medium">{service.name}</span>
              {slot ? <span className="text-[#6e6468]"> · {formatDayShort(slot.date)}, {formatTime(slot.time)}</span> : null}
            </span>
            <span className="shrink-0 font-medium font-tabular">{formatServicePrice(service, currency)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Step({
  n,
  title,
  open,
  summary,
  onChange,
  refCallback,
  children,
}: {
  n: number;
  title: string;
  open: boolean;
  summary: string | null;
  onChange?: () => void;
  refCallback: (el: HTMLElement | null) => void;
  children: React.ReactNode;
}) {
  const collapsed = !open && summary;
  return (
    <li ref={refCallback} className="min-w-0 scroll-mt-6 border-b border-[#ece6e3] pb-6">
      <div className="flex items-baseline gap-4">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium font-tabular ${
            collapsed ? "bg-[var(--brand)] text-[var(--brand-ink)]" : "border border-[#1f1a1c]"
          }`}
          aria-hidden
        >
          {n}
        </span>
        <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
          <h2 className="min-w-0 text-lg font-medium">{title}</h2>
          {collapsed && onChange ? (
            <button type="button" onClick={onChange} className="shrink-0 text-sm text-[#6e6468] underline underline-offset-4 hover:text-[#1f1a1c]">
              Change
            </button>
          ) : null}
        </div>
      </div>
      {collapsed ? <p className="mt-1 pl-11 text-[#4a4145]">{summary}</p> : null}
      {open ? <div className="mt-5 min-w-0 sm:pl-11">{children}</div> : null}
    </li>
  );
}

function PersonButton({
  name,
  detail,
  photoUrl,
  selected,
  onClick,
}: {
  name: string;
  detail?: string;
  photoUrl?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
        selected ? "border-[var(--brand)] ring-1 ring-[var(--brand)]" : "border-[#d9d1cd] hover:border-[#1f1a1c]"
      }`}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="size-12 rounded-full object-cover" />
      ) : (
        <span className="flex size-12 items-center justify-center rounded-full bg-[var(--accent)] font-[family-name:var(--font-heading)] text-lg text-[var(--accent-ink)]">
          {name === "Anyone available" ? "✶" : name.charAt(0)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-medium">{name}</span>
        {detail ? <span className="block truncate text-sm text-[#6e6468]">{detail}</span> : null}
      </span>
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-[#d9d1cd] px-4 py-3 text-base outline-none focus:border-[#1f1a1c]"
      />
      {hint ? <span className="text-xs text-[#6e6468]">{hint}</span> : null}
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-6 py-3">
      <dt className="w-20 shrink-0 text-[#6e6468]">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Summary({
  service,
  person,
  slot,
  currency,
  businessName,
  paymentNotice,
}: {
  service: Service | null;
  person: string | null;
  slot: SlotOption | null;
  currency: string;
  businessName: string;
  paymentNotice: string | null;
}) {
  return (
    <div className="rounded-3xl bg-[var(--accent)] p-6 text-[var(--accent-ink)]">
      <p className="font-[family-name:var(--font-heading)] text-2xl">Your appointment</p>
      <p className="mt-1 text-sm opacity-70">at {businessName}</p>
      <dl className="mt-6 grid gap-4 text-[15px]">
        <SummaryLine label="Service" value={service ? service.name : null} extra={service ? formatDuration(service.durationMinutes) : null} />
        <SummaryLine label="With" value={service ? person : null} />
        <SummaryLine label="When" value={slot ? formatDayLong(slot.date) : null} extra={slot ? formatTime(slot.time) : null} />
      </dl>
      {service ? (
        <div className="mt-6 flex items-baseline justify-between border-t border-black/10 pt-4">
          <span className="text-sm opacity-70">Price</span>
          <span className="text-lg font-medium font-tabular">{formatServicePrice(service, currency)}</span>
        </div>
      ) : null}
      <p className="mt-4 text-xs opacity-70">{paymentNotice ?? "Pay at the salon."}</p>
    </div>
  );
}

function SummaryLine({ label, value, extra }: { label: string; value: string | null; extra?: string | null }) {
  return (
    <div>
      <dt className="text-xs opacity-60">{label}</dt>
      <dd className={value ? "font-medium" : "opacity-40"}>
        {value ?? "Not chosen yet"}
        {value && extra ? <span className="block text-sm font-normal opacity-70">{extra}</span> : null}
      </dd>
    </div>
  );
}
