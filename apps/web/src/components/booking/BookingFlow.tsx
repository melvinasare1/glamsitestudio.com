"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Lock,
  Users,
} from "lucide-react";
import Image from "next/image";
import { addDays, depositAmountCents, formatDayLong, formatDayShort, staffForService, type PaymentPolicy } from "@glamsite/shared/booking";
import { formatDuration, formatMoney, formatServicePrice, formatTime, groupServices } from "@glamsite/shared/format";
import type { Service, ServiceCategory } from "@glamsite/shared/types";
import { track } from "@/lib/track";

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
  /** From a `?ref=` link a referrer shared, if any. Not shown in the form. */
  initialReferralCode?: string;
  bookingHeading: string;
};

/** How many days of times we ask for at once. */
const PAGE_DAYS = 28;

/** Shared neutral tokens: only --brand/--accent (and their -ink pairs) flex per business. */
const BORDER = "#EAE8E5";
const MUTED = "#85817D";
const SECONDARY = "#625E5A";
const INK = "#252321";

type Details = {
  name: string;
  email: string;
  phone: string;
  notes: string;
  discountCode: string;
  agreed: boolean;
  website: string;
};

type Done = { token: string; status: "pending" | "confirmed"; slot: SlotOption; serviceId: string; staffName: string | null };
type StepState = "complete" | "active" | "upcoming";

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

  const [details, setDetails] = useState<Details>({
    name: "",
    email: "",
    phone: "",
    notes: "",
    discountCode: "",
    agreed: false,
    website: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const requestId = useRef(0);
  const stepRefs = useRef<Record<number, HTMLElement | null>>({});

  // Internal phase, independent of display numbering: 1 service, 2 staff (only when
  // askStaff), 3 time, 4 details. Renumbered display labels below just skip 2 when
  // there's no staff step — comparisons always use these fixed phase numbers.
  const PHASE_TIME = 3;
  const PHASE_DETAILS = 4;
  const step = !service ? 1 : askStaff && !staffChoice ? 2 : !slot ? PHASE_TIME : PHASE_DETAILS;
  const staffStepN = 2;
  const timeStepN = askStaff ? 3 : 2;
  const detailsStepN = askStaff ? 4 : 3;

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
          discountCode: details.discountCode,
          referralCode: props.initialReferralCode ?? "",
          website: details.website,
        }),
      });
      const body = (await response.json()) as {
        token?: string;
        status?: "pending" | "confirmed";
        checkoutUrl?: string;
        error?: string;
        code?: string;
      };
      if (response.ok && body.checkoutUrl) {
        track("checkout_started", { slug: props.slug, serviceId: service.id });
        window.location.href = body.checkoutUrl;
        return;
      }
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
      <section className="mx-auto max-w-xl py-8 md:py-16" aria-live="polite">
        <div className="text-center">
          <span
            className="mx-auto flex size-[76px] items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]"
            aria-hidden
          >
            <Check className="size-9" strokeWidth={1.8} />
          </span>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
            {done.status === "confirmed" ? "Appointment confirmed" : "Booking request"}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-4xl leading-tight md:text-5xl">
            {done.status === "confirmed" ? "You're booked in." : "Request sent."}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7" style={{ color: SECONDARY }}>
            {done.status === "confirmed"
              ? `We've emailed your confirmation to ${details.email}.`
              : `${props.businessName} will confirm your appointment shortly. We'll email ${details.email} when they do.`}
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border" style={{ borderColor: BORDER }}>
          <div className="border-b px-6 py-4" style={{ borderColor: BORDER, backgroundColor: "#FAF9F7" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
              Appointment details
            </p>
          </div>
          <dl className="divide-y px-6" style={{ borderColor: BORDER }}>
            <Row label="When">
              {formatDayLong(done.slot.date)}, {formatTime(done.slot.time)}
            </Row>
            <Row label="Service">
              {bookedService.name} · {formatDuration(bookedService.durationMinutes)}
            </Row>
            {done.staffName ? <Row label="With">{done.staffName}</Row> : null}
            <Row label="Price">{formatServicePrice(bookedService, currency)}</Row>
          </dl>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={icsHref(
              `${bookedService.name} at ${props.businessName}`,
              props.businessName,
              done.slot.startsAt,
              bookedService.durationMinutes,
              manageUrl
            )}
            download="appointment.ics"
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:opacity-90"
          >
            <Calendar className="size-4" aria-hidden />
            Add to calendar
          </a>
          <a
            href={manageHref}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-medium hover:bg-[#FAF9F7]"
            style={{ borderColor: BORDER }}
          >
            View or manage appointment
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
          <a href={props.homeHref} className="flex min-h-11 w-full items-center justify-center text-sm" style={{ color: SECONDARY }}>
            Back to {props.businessName}
          </a>
        </div>
      </section>
    );
  }

  const groups = groupServices(props.categories, services);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight md:text-5xl">{props.bookingHeading}</h1>
        <p className="mt-2 text-sm" style={{ color: MUTED }}>
          Choose your service, find a time and you&apos;re all set.
        </p>

        <div className="mt-9">
          {/* 1. Service */}
          <StepRail
            number={1}
            title="Choose a service"
            state={step === 1 ? "active" : "complete"}
            summary={service ? `${service.name} · ${formatDuration(service.durationMinutes)} · ${formatServicePrice(service, currency)}` : undefined}
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
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                      {group.category?.name ?? "Other services"}
                    </h3>
                  ) : null}
                  <div className="grid gap-3">
                    {group.services.map((item) => {
                      const selected = item.id === serviceId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setServiceId(item.id);
                            setStaffChoice(null);
                            track("booking_started", { slug: props.slug, serviceId: item.id });
                          }}
                          className="flex w-full items-center gap-4 rounded-xl border p-3.5 text-left transition sm:p-4"
                          style={{
                            borderColor: selected ? "var(--brand)" : BORDER,
                            backgroundColor: selected ? "var(--accent)" : "#fff",
                          }}
                        >
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt="" width={72} height={72} className="size-[72px] shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span className="flex size-[72px] shrink-0 items-center justify-center rounded-lg bg-[#F4F2EF] font-[family-name:var(--font-heading)] text-lg" style={{ color: MUTED }}>
                              {item.name.charAt(0)}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{item.name}</span>
                            <span className="mt-1 block text-xs" style={{ color: MUTED }}>
                              {formatDuration(item.durationMinutes)}
                            </span>
                            {item.description ? (
                              <span className="mt-1.5 block max-w-prose text-sm leading-5" style={{ color: MUTED }}>
                                {item.description}
                              </span>
                            ) : null}
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-3">
                            <span className="font-tabular block text-sm font-semibold">{formatServicePrice(item, currency)}</span>
                            <span
                              className="flex size-6 items-center justify-center rounded-full border"
                              style={{
                                borderColor: selected ? "var(--brand)" : "#DAD6D1",
                                backgroundColor: selected ? "var(--brand)" : "#fff",
                                color: selected ? "var(--brand-ink)" : "transparent",
                              }}
                              aria-hidden
                            >
                              <Check className="size-3.5" />
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </StepRail>

          {/* 2. Who */}
          {service && askStaff ? (
            <StepRail
              number={staffStepN}
              title="Who would you like to see?"
              state={step < staffStepN ? "upcoming" : step === staffStepN ? "active" : "complete"}
              summary={staffChoice === "any" ? "Anyone available" : chosenPerson?.name}
              onChange={() => setStaffChoice(null)}
              refCallback={(el) => (stepRefs.current[2] = el)}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <PersonCard
                  name="Anyone available"
                  detail="Shows the most times"
                  selected={staffChoice === "any"}
                  onClick={() => setStaffChoice("any")}
                  anyone
                />
                {team.map((person) => (
                  <PersonCard
                    key={person.id}
                    name={person.name}
                    detail={person.role}
                    photoUrl={person.photoUrl}
                    selected={staffChoice === person.id}
                    onClick={() => setStaffChoice(person.id)}
                  />
                ))}
              </div>
            </StepRail>
          ) : null}

          {/* 3. Time */}
          {service ? (
            <StepRail
              number={timeStepN}
              title="Pick a time"
              state={step < PHASE_TIME ? "upcoming" : step === PHASE_TIME ? "active" : "complete"}
              summary={slot ? `${formatDayLong(slot.date)}, ${formatTime(slot.time)}` : undefined}
              onChange={() => setSlot(null)}
              refCallback={(el) => (stepRefs.current[3] = el)}
            >
              {loadError ? <p className="mb-4 rounded-lg bg-[#FBF3F1] px-4 py-3 text-sm text-[#9b1c1c]">{loadError}</p> : null}
              {!range && loading ? (
                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl" style={{ backgroundColor: "#FAF9F7" }} role="status" aria-live="polite">
                  <Loader2 className="size-6 animate-spin" style={{ color: "var(--brand)" }} aria-hidden />
                  <p className="text-sm" style={{ color: SECONDARY }}>
                    Finding available times…
                  </p>
                </div>
              ) : null}
              {range ? (
                <>
                  <div className="flex items-center gap-2 pb-3">
                    <button
                      type="button"
                      aria-label="Previous week"
                      disabled={!canGoPrevWeek}
                      onClick={prevWeek}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border transition hover:border-[#1f1a1c] disabled:cursor-not-allowed disabled:opacity-30"
                      style={{ borderColor: BORDER, color: SECONDARY }}
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
                            className="flex flex-col items-center gap-1.5 rounded-xl border py-2.5 transition"
                            style={
                              selected
                                ? { borderColor: "var(--brand)", backgroundColor: "var(--brand)", color: "var(--brand-ink)" }
                                : open
                                  ? { borderColor: BORDER, color: INK }
                                  : { borderColor: "#F0EEEB", backgroundColor: "#F8F7F5", color: "#C5C0BA", textDecoration: "line-through" }
                            }
                          >
                            <span className="text-[10px] tracking-wide">{formatDayShort(d).split(" ")[0]}</span>
                            <span className="font-tabular text-lg font-semibold leading-tight">{Number(dd)}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      aria-label="Next week"
                      disabled={!canGoNextWeek || loading}
                      onClick={() => void nextWeek()}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border transition hover:border-[#1f1a1c] disabled:cursor-not-allowed disabled:opacity-30"
                      style={{ borderColor: BORDER, color: SECONDARY }}
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  </div>

                  {day ? (
                    <div className="mt-5">
                      <h3 className="font-[family-name:var(--font-heading)] text-xl">{formatDayLong(day)}</h3>
                      {(["Morning", "Afternoon", "Evening"] as const).map((part) => {
                        const times = daySlots.filter((item) => partOfDay(item.time) === part);
                        if (!times.length) return null;
                        return (
                          <div key={part} className="mt-5">
                            <p className="mb-2.5 text-sm font-medium" style={{ color: INK }}>
                              {part}
                            </p>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                              {times.map((item) => (
                                <button
                                  key={item.startsAt}
                                  type="button"
                                  onClick={() => {
                                    setSlot(item);
                                    setLoadError(null);
                                  }}
                                  className="font-tabular rounded-lg border py-2.5 text-sm font-medium transition hover:border-[var(--brand)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
                                  style={{ borderColor: BORDER }}
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
                    <p className="py-5 rounded-xl px-4 text-center text-sm" style={{ backgroundColor: "#FAF9F7", color: MUTED }}>
                      No free times this week. {canGoNextWeek ? "Try the next week." : "Please get in touch to book."}
                    </p>
                  )}
                </>
              ) : null}
            </StepRail>
          ) : null}

          {/* 4. Details */}
          {service ? (
            <StepRail
              number={detailsStepN}
              title="Your details"
              state={step < PHASE_DETAILS ? "upcoming" : "active"}
              onChange={undefined}
              refCallback={(el) => (stepRefs.current[4] = el)}
              last
            >
              <form onSubmit={book} className="grid gap-5" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Full name" autoComplete="name" value={details.name} required onChange={(name) => setDetails((d) => ({ ...d, name }))} />
                  <TextField label="Phone" type="tel" autoComplete="tel" value={details.phone} required onChange={(phone) => setDetails((d) => ({ ...d, phone }))} />
                </div>
                <TextField
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={details.email}
                  required
                  hint="Your confirmation goes here."
                  onChange={(email) => setDetails((d) => ({ ...d, email }))}
                />
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">
                    Anything they should know? <span className="font-normal" style={{ color: MUTED }}>(optional)</span>
                  </span>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={details.notes}
                    onChange={(event) => setDetails((d) => ({ ...d, notes: event.target.value }))}
                    className="rounded-xl border px-4 py-3 text-base outline-none focus:border-[var(--brand)]"
                    style={{ borderColor: BORDER }}
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
                  <>
                    <div className="flex gap-3 rounded-xl border p-4" style={{ borderColor: BORDER, backgroundColor: "#FAF9F7" }}>
                      <Lock className="mt-0.5 size-[18px] shrink-0" style={{ color: SECONDARY }} aria-hidden />
                      <div>
                        <p className="text-sm font-medium">Payment required</p>
                        <p className="mt-1 text-sm leading-6" style={{ color: SECONDARY }}>
                          {paymentNotice}
                        </p>
                      </div>
                    </div>
                    <details className="group rounded-xl border p-4" style={{ borderColor: BORDER }}>
                      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                        Have a discount code?
                        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                      </summary>
                      <input
                        type="text"
                        maxLength={40}
                        value={details.discountCode}
                        onChange={(event) => setDetails((d) => ({ ...d, discountCode: event.target.value }))}
                        placeholder="Enter discount code"
                        className="mt-4 h-12 w-full rounded-lg border px-4 text-sm outline-none focus:border-[var(--brand)] sm:max-w-xs"
                        style={{ borderColor: BORDER }}
                      />
                    </details>
                  </>
                ) : null}

                {props.policyText.trim() ? (
                  <div className="rounded-xl border p-4" style={{ borderColor: BORDER, backgroundColor: "#FAF9F7" }}>
                    <p className="text-sm font-medium">Booking &amp; cancellation policy</p>
                    <p className="mt-1.5 whitespace-pre-line text-xs leading-6" style={{ color: SECONDARY }}>
                      {props.policyText.trim()}
                    </p>
                    <label className="mt-4 flex items-start gap-2.5 border-t pt-4" style={{ borderColor: BORDER }}>
                      <input
                        type="checkbox"
                        checked={details.agreed}
                        onChange={(event) => setDetails((d) => ({ ...d, agreed: event.target.checked }))}
                        className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
                      />
                      <span className="text-sm">I&apos;ve read and agree to the booking and cancellation policy</span>
                    </label>
                  </div>
                ) : null}

                <p className="text-sm" style={{ color: MUTED }}>
                  {props.cancellationNoticeHours > 0
                    ? `You can cancel online up to ${props.cancellationNoticeHours} hours before your appointment.`
                    : "You can cancel online any time before your appointment."}
                  {props.autoConfirm ? "" : ` ${props.businessName} confirms each booking by email.`}
                </p>

                {formError ? (
                  <p className="flex items-center gap-2 rounded-lg bg-[#FBF3F1] px-4 py-3 text-sm text-[#9b1c1c]" role="alert">
                    <AlertCircle className="size-4 shrink-0" aria-hidden />
                    {formError}
                  </p>
                ) : null}

                <div className="grid gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-8 font-medium text-[var(--brand-ink)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Processing…
                      </>
                    ) : (
                      <>
                        {props.autoConfirm ? "Book appointment" : "Request appointment"}
                        <ArrowRight className="size-4" aria-hidden />
                      </>
                    )}
                  </button>
                  {paymentNotice ? (
                    <p className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                      <Lock className="size-3" aria-hidden />
                      Secure payment on the next step
                    </p>
                  ) : null}
                </div>
              </form>
            </StepRail>
          ) : null}
        </div>
      </div>

      {/* The appointment as it takes shape. */}
      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <Summary
            service={service}
            person={staffChoice === "any" ? "Anyone available" : chosenPerson?.name ?? null}
            slot={slot}
            currency={currency}
            businessName={props.businessName}
            paymentNotice={paymentNotice}
          />
        </div>
      </aside>

      {service ? (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-white/95 px-4 py-3 backdrop-blur lg:hidden" style={{ borderColor: BORDER, paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="mx-auto flex max-w-6xl items-center gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium">{service.name}</span>
              {slot ? (
                <span style={{ color: MUTED }}> · {formatDayShort(slot.date)}, {formatTime(slot.time)}</span>
              ) : null}
            </span>
            <span className="font-tabular shrink-0 font-semibold">{formatServicePrice(service, currency)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepRail({
  number,
  title,
  state,
  summary,
  onChange,
  refCallback,
  last = false,
  children,
}: {
  number: number;
  title: string;
  state: StepState;
  summary?: string | null;
  onChange?: () => void;
  refCallback: (el: HTMLElement | null) => void;
  last?: boolean;
  children: React.ReactNode;
}) {
  const complete = state === "complete";
  const active = state === "active";
  return (
    <section ref={refCallback} className="flex gap-4 scroll-mt-6 sm:gap-5">
      <div className="flex flex-col items-center">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"
          style={
            complete
              ? { borderColor: "var(--brand)", backgroundColor: "var(--brand)", color: "var(--brand-ink)" }
              : active
                ? { borderColor: "var(--brand)", backgroundColor: "var(--accent)", color: "var(--accent-ink)" }
                : { borderColor: "#E5E2DE", backgroundColor: "#fff", color: "#99938D" }
          }
        >
          {complete ? <Check className="size-4" aria-hidden /> : number}
        </div>
        {!last ? <div className="mt-2 w-px flex-1" style={{ backgroundColor: complete ? "var(--brand)" : BORDER, opacity: complete ? 0.4 : 1, minHeight: 24 }} /> : null}
      </div>

      <div className="min-w-0 flex-1 pb-12 sm:pb-14">
        <div className="flex min-h-9 items-center justify-between gap-3">
          <h2 className="min-w-0 font-[family-name:var(--font-heading)] text-xl">{title}</h2>
          {complete && onChange ? (
            <button type="button" onClick={onChange} className="shrink-0 text-sm font-medium underline-offset-4 hover:underline" style={{ color: "var(--brand)" }}>
              Change
            </button>
          ) : null}
        </div>

        {complete ? (
          <p className="mt-2 flex items-center gap-2 text-sm" style={{ color: SECONDARY }}>
            <Check className="size-4 shrink-0" style={{ color: "var(--brand)" }} aria-hidden />
            <span className="truncate">{summary}</span>
          </p>
        ) : active ? (
          <div className="mt-5 min-w-0">{children}</div>
        ) : (
          <p className="mt-2 text-sm" style={{ color: "#A29D97" }}>
            Complete the previous step to continue.
          </p>
        )}
      </div>
    </section>
  );
}

function PersonCard({
  name,
  detail,
  photoUrl,
  selected,
  onClick,
  anyone = false,
}: {
  name: string;
  detail?: string;
  photoUrl?: string;
  selected: boolean;
  onClick: () => void;
  anyone?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="relative flex min-w-0 flex-col items-center gap-3 rounded-xl border p-4 text-center transition"
      style={{ borderColor: selected ? "var(--brand)" : BORDER, backgroundColor: selected ? "var(--accent)" : "#fff" }}
    >
      <div className="relative">
        {anyone ? (
          <span className="flex size-14 items-center justify-center rounded-full bg-[#F1EFEC]">
            <Users className="size-6" style={{ color: "#77716B" }} aria-hidden />
          </span>
        ) : photoUrl ? (
          <Image src={photoUrl} alt="" width={56} height={56} className="size-14 rounded-full object-cover" />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--accent)] font-[family-name:var(--font-heading)] text-lg text-[var(--accent-ink)]">
            {name.charAt(0)}
          </span>
        )}
        {selected ? (
          <span
            className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border-2 border-white"
            style={{ backgroundColor: "var(--brand)", color: "var(--brand-ink)" }}
            aria-hidden
          >
            <Check className="size-3.5" />
          </span>
        ) : null}
      </div>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{name}</span>
        {detail ? (
          <span className="mt-0.5 block truncate text-xs" style={{ color: MUTED }}>
            {detail}
          </span>
        ) : null}
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
        className="h-12 rounded-lg border px-4 text-base outline-none focus:border-[var(--brand)]"
        style={{ borderColor: BORDER }}
      />
      {hint ? (
        <span className="text-xs" style={{ color: MUTED }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-6 py-4">
      <dt className="w-20 shrink-0" style={{ color: MUTED }}>
        {label}
      </dt>
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
    <>
      <div className="rounded-2xl border bg-white p-7 shadow-[0_4px_24px_rgba(0,0,0,0.035)]" style={{ borderColor: BORDER }}>
        <div className="flex items-center justify-between">
          <p className="font-[family-name:var(--font-heading)] text-xl">Your appointment</p>
          <Calendar className="size-[19px]" style={{ color: MUTED }} aria-hidden />
        </div>
        <p className="mt-1 text-xs" style={{ color: MUTED }}>
          at {businessName}
        </p>

        <div className="my-6 border-t" style={{ borderColor: BORDER }} />

        <dl className="grid gap-4 text-[15px]">
          <SummaryLine label="Service" value={service ? service.name : null} extra={service ? formatDuration(service.durationMinutes) : null} />
          <SummaryLine label="With" value={service ? person : null} />
          <SummaryLine label="When" value={slot ? formatDayLong(slot.date) : null} extra={slot ? formatTime(slot.time) : null} />
        </dl>
        {service ? (
          <div className="mt-6 flex items-baseline justify-between border-t pt-4" style={{ borderColor: BORDER }}>
            <span className="text-sm" style={{ color: SECONDARY }}>
              Estimated price
            </span>
            <span className="font-tabular text-lg font-semibold">{formatServicePrice(service, currency)}</span>
          </div>
        ) : null}
      </div>
      <p className="mt-4 flex items-start gap-2 px-1 text-xs leading-5" style={{ color: MUTED }}>
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {paymentNotice ?? "Your information is handled securely and used to manage your appointment."}
      </p>
    </>
  );
}

function SummaryLine({ label, value, extra }: { label: string; value: string | null; extra?: string | null }) {
  return (
    <div>
      <dt className="text-xs" style={{ color: MUTED }}>
        {label}
      </dt>
      <dd className={value ? "font-medium" : ""} style={!value ? { color: "#C2BDB7" } : undefined}>
        {value ?? "Not chosen yet"}
        {value && extra ? (
          <span className="block text-sm font-normal" style={{ color: SECONDARY }}>
            {extra}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
