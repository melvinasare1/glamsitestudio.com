"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  User,
  Users,
  X,
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
  /** Landed here via Checkout's cancel_url: payment wasn't completed, nothing was booked. */
  paymentCancelled?: boolean;
};

/** How many days of times we ask for at once. */
const PAGE_DAYS = 28;

/** Shared neutral tokens: only --brand/--accent (and their -ink pairs) flex per business. */
const BORDER = "#E8E6E3";
const MUTED = "#8A8580";
const SECONDARY = "#5E5954";
const SURFACE = "#F7F6F4";

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
type StepKey = "service" | "staff" | "time" | "details";
const STEP_LABEL: Record<StepKey, string> = { service: "Service", staff: "Staff", time: "Time", details: "Details" };

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
        ? `Full payment of ${formatMoney(depositCents, currency)} is required to secure your booking.`
        : `A ${formatMoney(depositCents, currency)} deposit is required to secure your booking.`;

  // Before a service is chosen we don't yet know whether it needs a staff step, so the
  // tracker assumes one (the common case) until the real answer narrows it.
  const stepDefs = useMemo<{ key: StepKey; label: string }[]>(() => {
    const defs: { key: StepKey; label: string }[] = [{ key: "service", label: STEP_LABEL.service }];
    if (!service || askStaff) defs.push({ key: "staff", label: STEP_LABEL.staff });
    defs.push({ key: "time", label: STEP_LABEL.time }, { key: "details", label: STEP_LABEL.details });
    return defs;
  }, [service, askStaff]);

  const [activeKey, setActiveKey] = useState<StepKey>("service");
  const activeIndex = stepDefs.findIndex((s) => s.key === activeKey);
  const panelRef = useRef<HTMLDivElement | null>(null);

  function goTo(key: StepKey) {
    setActiveKey(key);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function goNext() {
    const next = stepDefs[stepDefs.findIndex((s) => s.key === activeKey) + 1];
    if (next) goTo(next.key);
  }

  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [range, setRange] = useState<{ first: string; loadedTo: string; last: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotOption | null>(null);
  /** The first day of the 7-day window shown in the time step. */
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
  const [showCancelledNotice, setShowCancelledNotice] = useState(props.paymentCancelled ?? false);

  const requestId = useRef(0);

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
      <section className="mx-auto max-w-xl rounded-2xl border bg-white p-8 sm:p-10" style={{ borderColor: BORDER }} aria-live="polite">
        <div className="text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]" aria-hidden>
            <Check className="size-8" strokeWidth={2} />
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {done.status === "confirmed" ? "You're booked in!" : "Request sent!"}
          </h1>
          <p className="mt-2 text-sm" style={{ color: SECONDARY }}>
            {done.status === "confirmed"
              ? `We've sent a confirmation to ${details.email}.`
              : `${props.businessName} will confirm your appointment shortly. We'll email ${details.email} when they do.`}
          </p>
        </div>

        <dl className="mt-7 grid gap-4 rounded-xl p-5" style={{ backgroundColor: SURFACE }}>
          <SummaryRow icon={Calendar}>
            {formatDayLong(done.slot.date)} at {formatTime(done.slot.time)}
          </SummaryRow>
          <SummaryRow icon={Tag}>
            {bookedService.name} · {formatDuration(bookedService.durationMinutes)}
          </SummaryRow>
          {done.staffName ? <SummaryRow icon={User}>With {done.staffName}</SummaryRow> : null}
          <SummaryRow icon={Tag}>
            {formatServicePrice(bookedService, currency)}
            {paymentNotice ? ` (${formatMoney(depositCents ?? 0, currency)} ${props.paymentPolicy === "full" ? "paid" : "deposit paid"})` : null}
          </SummaryRow>
        </dl>

        <div className="mt-6 flex flex-col gap-2.5">
          <a
            href={icsHref(
              `${bookedService.name} at ${props.businessName}`,
              props.businessName,
              done.slot.startsAt,
              bookedService.durationMinutes,
              manageUrl
            )}
            download="appointment.ics"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium hover:bg-[#FAF9F7]"
            style={{ borderColor: BORDER }}
          >
            <Calendar className="size-4" aria-hidden />
            Add to calendar
          </a>
          <a
            href={manageHref}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium hover:bg-[#FAF9F7]"
            style={{ borderColor: BORDER }}
          >
            View or cancel appointment
          </a>
          <a
            href={props.homeHref}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-medium"
            style={{ color: SECONDARY }}
          >
            Back to website
          </a>
        </div>
      </section>
    );
  }

  const allGroups = groupServices(props.categories, services);
  const visibleGroups = categoryFilter === "all" ? allGroups : allGroups.filter((g) => g.category?.id === categoryFilter);
  const categoryTabs = allGroups.map((g) => g.category).filter((c): c is ServiceCategory => c !== null);

  return (
    <>
      {showCancelledNotice ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#ece6e3] bg-[#f7f4f2] px-4 py-3.5 text-sm text-[#4a4145]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="flex-1">Payment wasn&apos;t completed, so this time wasn&apos;t booked. Pick a time below to try again.</p>
          <button
            type="button"
            onClick={() => setShowCancelledNotice(false)}
            aria-label="Dismiss"
            className="shrink-0 text-[#6e6468] hover:text-[#2b1631]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
        <div className="rounded-2xl border bg-white p-5 sm:p-8" style={{ borderColor: BORDER }} ref={panelRef}>
        {/* Header: heading + step tracker */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b pb-6" style={{ borderColor: BORDER }}>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold">{props.bookingHeading}</h1>
          <ol className="flex items-center gap-1.5 overflow-x-auto sm:gap-2.5" aria-label="Booking steps">
            {stepDefs.map((s, i) => (
              <li key={s.key} className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  type="button"
                  disabled={i > activeIndex}
                  onClick={() => goTo(s.key)}
                  className="flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-medium transition disabled:cursor-not-allowed"
                  style={
                    i === activeIndex
                      ? { backgroundColor: "var(--brand)", color: "var(--brand-ink)" }
                      : i < activeIndex
                        ? { color: SECONDARY }
                        : { color: "#B9B4AE" }
                  }
                >
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={
                      i === activeIndex
                        ? { backgroundColor: "var(--brand-ink)", color: "var(--brand)" }
                        : i < activeIndex
                          ? { backgroundColor: "var(--accent)", color: "var(--accent-ink)" }
                          : { border: "1px solid #E0DCD7" }
                    }
                  >
                    {i < activeIndex ? <Check className="size-3.5" aria-hidden /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < stepDefs.length - 1 ? <span className="h-px w-3 shrink-0" style={{ backgroundColor: "#E0DCD7" }} aria-hidden /> : null}
              </li>
            ))}
          </ol>
        </div>

        {/* Panel content */}
        <div className="pt-6">
          {activeKey === "service" ? (
            <div>
              <h2 className="text-lg font-semibold">Choose a service</h2>

              {categoryTabs.length > 1 ? (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  <CategoryTab label="All services" active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")} />
                  {categoryTabs.map((cat) => (
                    <CategoryTab key={cat.id} label={cat.name} active={categoryFilter === cat.id} onClick={() => setCategoryFilter(cat.id)} />
                  ))}
                </div>
              ) : null}

              <div className="mt-5 grid gap-6">
                {visibleGroups.map((group) => (
                  <div key={group.category?.id ?? "other"}>
                    {categoryFilter === "all" && visibleGroups.length > 1 ? (
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
                            style={{ borderColor: selected ? "var(--brand)" : BORDER, backgroundColor: selected ? "var(--accent)" : "#fff" }}
                          >
                            {item.imageUrl ? (
                              <Image src={item.imageUrl} alt="" width={64} height={64} className="size-16 shrink-0 rounded-lg object-cover" />
                            ) : (
                              <span
                                className="flex size-16 shrink-0 items-center justify-center rounded-lg font-[family-name:var(--font-heading)] text-lg"
                                style={{ backgroundColor: SURFACE, color: MUTED }}
                              >
                                {item.name.charAt(0)}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium">{item.name}</span>
                              {item.description ? (
                                <span className="mt-0.5 block max-w-prose truncate text-sm" style={{ color: MUTED }}>
                                  {item.description}
                                </span>
                              ) : null}
                              <span className="mt-1 block text-xs" style={{ color: MUTED }}>
                                {formatDuration(item.durationMinutes)}
                              </span>
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-3">
                              <span className="font-tabular block text-sm font-semibold">{formatServicePrice(item, currency)}</span>
                              <span
                                className="flex size-5 shrink-0 items-center justify-center rounded-full border-2"
                                style={{ borderColor: selected ? "var(--brand)" : "#D6D1CB" }}
                                aria-hidden
                              >
                                {selected ? <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--brand)" }} /> : null}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <PanelAction disabled={!service} onClick={goNext} />
            </div>
          ) : null}

          {activeKey === "staff" ? (
            <div>
              <h2 className="text-lg font-semibold">Who would you like to see?</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <PersonRow
                  name="Anyone available"
                  detail="Shows the most available times"
                  selected={staffChoice === "any"}
                  onClick={() => setStaffChoice("any")}
                  anyone
                />
                {team.map((person) => (
                  <PersonRow
                    key={person.id}
                    name={person.name}
                    detail={person.role}
                    photoUrl={person.photoUrl}
                    selected={staffChoice === person.id}
                    onClick={() => setStaffChoice(person.id)}
                  />
                ))}
              </div>
              <PanelAction disabled={!staffChoice} onClick={goNext} />
            </div>
          ) : null}

          {activeKey === "time" ? (
            <div>
              <h2 className="text-lg font-semibold">Pick a time</h2>

              {loadError ? <p className="mb-4 mt-4 rounded-lg bg-[#FBF3F1] px-4 py-3 text-sm text-[#9b1c1c]">{loadError}</p> : null}
              {!range && loading ? (
                <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl" style={{ backgroundColor: SURFACE }} role="status" aria-live="polite">
                  <Loader2 className="size-6 animate-spin" style={{ color: "var(--brand)" }} aria-hidden />
                  <p className="text-sm" style={{ color: SECONDARY }}>
                    Finding available times…
                  </p>
                </div>
              ) : null}
              {range ? (
                <>
                  <div className="mt-5 flex items-center gap-2">
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
                                  ? { borderColor: BORDER }
                                  : { borderColor: "#F0EEEB", backgroundColor: SURFACE, color: "#C5C0BA", textDecoration: "line-through" }
                            }
                          >
                            <span className="text-[10px] tracking-wide">{formatDayShort(d).split(" ")[0]}</span>
                            <span className="font-tabular text-sm font-semibold leading-tight">{Number(dd)}</span>
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
                      {(["Morning", "Afternoon", "Evening"] as const).map((part) => {
                        const times = daySlots.filter((item) => partOfDay(item.time) === part);
                        if (!times.length) return null;
                        return (
                          <div key={part} className="mt-5 first:mt-0">
                            <p className="mb-2.5 text-sm font-medium">{part}</p>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                              {times.map((item) => {
                                const selected = slot?.startsAt === item.startsAt;
                                return (
                                  <button
                                    key={item.startsAt}
                                    type="button"
                                    onClick={() => {
                                      setSlot(item);
                                      setLoadError(null);
                                    }}
                                    className="font-tabular rounded-lg border py-2.5 text-sm font-medium transition"
                                    style={
                                      selected
                                        ? { borderColor: "var(--brand)", backgroundColor: "var(--brand)", color: "var(--brand-ink)" }
                                        : { borderColor: BORDER }
                                    }
                                  >
                                    {formatTime(item.time)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-5 rounded-xl px-4 py-5 text-center text-sm" style={{ backgroundColor: SURFACE, color: MUTED }}>
                      No free times this week. {canGoNextWeek ? "Try the next week." : "Please get in touch to book."}
                    </p>
                  )}
                </>
              ) : null}

              <PanelAction disabled={!slot} onClick={goNext} />
            </div>
          ) : null}

          {activeKey === "details" ? (
            <div>
              <h2 className="text-lg font-semibold">Your details</h2>
              <form onSubmit={book} className="mt-5 grid gap-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Name" autoComplete="name" value={details.name} required onChange={(name) => setDetails((d) => ({ ...d, name }))} />
                  <TextField label="Email" type="email" autoComplete="email" value={details.email} required onChange={(email) => setDetails((d) => ({ ...d, email }))} />
                </div>
                <TextField label="Phone" type="tel" autoComplete="tel" value={details.phone} required onChange={(phone) => setDetails((d) => ({ ...d, phone }))} />
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">
                    Notes <span className="font-normal" style={{ color: MUTED }}>(optional)</span>
                  </span>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    placeholder="Anything we should know?"
                    value={details.notes}
                    onChange={(event) => setDetails((d) => ({ ...d, notes: event.target.value }))}
                    className="rounded-lg border px-3.5 py-3 text-base outline-none focus:border-[var(--brand)]"
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
                  <div className="flex gap-3 rounded-xl border border-[#F0D9A8] bg-[#FDF6E7] p-4">
                    <AlertTriangle className="mt-0.5 size-[18px] shrink-0 text-[#9A7616]" aria-hidden />
                    <p className="text-sm text-[#6B5713]">{paymentNotice}</p>
                  </div>
                ) : null}

                {paymentNotice ? (
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium">
                      Discount code <span className="font-normal" style={{ color: MUTED }}>(optional)</span>
                    </span>
                    <input
                      type="text"
                      maxLength={40}
                      value={details.discountCode}
                      onChange={(event) => setDetails((d) => ({ ...d, discountCode: event.target.value }))}
                      className="h-11 rounded-lg border px-3.5 text-sm outline-none focus:border-[var(--brand)] sm:max-w-xs"
                      style={{ borderColor: BORDER }}
                    />
                  </label>
                ) : null}

                {props.policyText.trim() ? (
                  <label className="flex items-start gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={details.agreed}
                      onChange={(event) => setDetails((d) => ({ ...d, agreed: event.target.checked }))}
                      className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
                    />
                    <span>
                      I agree to the{" "}
                      <span className="underline underline-offset-2" title={props.policyText.trim()}>
                        booking and cancellation policy
                      </span>
                      .
                    </span>
                  </label>
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-8 font-medium text-[var(--brand-ink)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
              </form>
            </div>
          ) : null}
        </div>
      </div>

      {/* Your appointment so far */}
      <aside className="lg:sticky lg:top-8">
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <Calendar className="size-[18px]" style={{ color: "var(--brand)" }} aria-hidden />
            <p className="font-semibold">Your appointment so far</p>
          </div>

          <div className="mt-5 grid gap-4">
            <SidebarField label="Service" value={service ? `${service.name} · ${formatServicePrice(service, currency)}` : null} onChange={service ? () => goTo("service") : undefined} />
            {stepDefs.some((s) => s.key === "staff") ? (
              <SidebarField
                label="Staff"
                value={staffChoice ? (staffChoice === "any" ? "Anyone available" : chosenPerson?.name ?? null) : null}
                onChange={staffChoice ? () => goTo("staff") : undefined}
              />
            ) : null}
            <SidebarField label="Time" value={slot ? `${formatDayShort(slot.date)}, ${formatTime(slot.time)}` : null} onChange={slot ? () => goTo("time") : undefined} />
            <SidebarField label="Your details" value={details.name ? details.name : null} />
          </div>

          <div className="mt-5 flex items-baseline justify-between border-t pt-4" style={{ borderColor: BORDER }}>
            <span className="text-sm font-medium">Total</span>
            <span className="font-tabular text-lg font-semibold">{service ? formatServicePrice(service, currency) : "—"}</span>
          </div>
        </div>
      </aside>
      </div>
    </>
  );
}

function PanelAction({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-7 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-8 font-medium text-[var(--brand-ink)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
    >
      Continue
      <ArrowRight className="size-4" aria-hidden />
    </button>
  );
}

function CategoryTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition"
      style={active ? { borderColor: "var(--accent)", backgroundColor: "var(--accent)", color: "var(--accent-ink)" } : { borderColor: BORDER, color: SECONDARY }}
    >
      {label}
    </button>
  );
}

function PersonRow({
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
      className="flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition"
      style={{ borderColor: selected ? "var(--brand)" : BORDER, backgroundColor: selected ? "var(--accent)" : "#fff" }}
    >
      {anyone ? (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: SURFACE }}>
          <Users className="size-5" style={{ color: MUTED }} aria-hidden />
        </span>
      ) : photoUrl ? (
        <Image src={photoUrl} alt="" width={44} height={44} className="size-11 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-[family-name:var(--font-heading)] text-base text-[var(--accent-ink)]">
          {name.charAt(0)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        {detail ? (
          <span className="block truncate text-xs" style={{ color: MUTED }}>
            {detail}
          </span>
        ) : null}
      </span>
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: selected ? "var(--brand)" : "#D6D1CB" }} aria-hidden>
        {selected ? <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--brand)" }} /> : null}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
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
        className="h-11 rounded-lg border px-3.5 text-base outline-none focus:border-[var(--brand)]"
        style={{ borderColor: BORDER }}
      />
    </label>
  );
}

function SidebarField({ label, value, onChange }: { label: string; value: string | null; onChange?: () => void }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
        style={value ? { backgroundColor: "var(--brand)", color: "var(--brand-ink)" } : { border: "1.5px solid #D6D1CB" }}
        aria-hidden
      >
        {value ? <Check className="size-3" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block truncate text-sm" style={{ color: value ? SECONDARY : "#B9B4AE" }}>
          {value ?? "Not selected yet"}
        </span>
      </span>
      {value && onChange ? (
        <button type="button" onClick={onChange} className="shrink-0 text-xs font-medium underline-offset-4 hover:underline" style={{ color: "var(--brand)" }}>
          Change
        </button>
      ) : null}
    </div>
  );
}

function SummaryRow({ icon: Icon, children }: { icon: typeof Calendar; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="size-4 shrink-0" style={{ color: "var(--brand)" }} aria-hidden />
      <span>{children}</span>
    </div>
  );
}
