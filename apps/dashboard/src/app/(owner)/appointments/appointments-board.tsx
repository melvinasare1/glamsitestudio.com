"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, MailIcon, PhoneIcon, StickyNoteIcon } from "lucide-react";
import {
  addDays,
  formatClock,
  formatDayLong,
  formatDayShort,
  STATUS_LABELS,
  zonedParts,
} from "@glamsite/shared/booking";
import { formatDuration, formatMoney } from "@glamsite/shared/format";
import type { Appointment, AppointmentStatus, Service, StaffMember } from "@glamsite/shared/types";
import { EmptyState, Field, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";
import {
  createManualAppointment,
  markDepositPaid,
  recordRefund,
  saveInternalNotes,
  setAppointmentStatus,
  type ManualAppointmentInput,
} from "./actions";

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  completed: "border-black/10 bg-mist text-muted-foreground",
  cancelled: "border-black/10 bg-white text-muted-foreground line-through",
  no_show: "border-rose-200 bg-rose-50 text-rose-700",
};

const SHORT_STATUS: Record<AppointmentStatus, string> = {
  pending: "To confirm",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

const DEPOSIT_LABEL: Record<Appointment["depositStatus"], string> = {
  none: "",
  pending: "Pending",
  paid: "Paid",
  refunded: "Refunded",
  forfeited: "Forfeited",
};

type Props = {
  timeZone: string;
  today: string;
  week: string;
  staffFilter: string;
  appointments: Appointment[];
  pending: Appointment[];
  staff: StaffMember[];
  services: Service[];
  openNew: boolean;
};

export function AppointmentsBoard(props: Props) {
  const { timeZone, today, week } = props;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { pending: saving, run } = useAction();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(props.openNew);
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => setCreating(props.openNew), [props.openNew]);

  function go(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const forStaff = props.appointments.filter(
    (item) => props.staffFilter === "all" || item.staffId === props.staffFilter
  );
  const cancelledCount = forStaff.filter((item) => item.status === "cancelled").length;
  const visible = showCancelled ? forStaff : forStaff.filter((item) => item.status !== "cancelled");
  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const item of visible) {
      const day = zonedParts(new Date(item.startsAt), timeZone).ymd;
      map.set(day, [...(map.get(day) ?? []), item]);
    }
    return map;
  }, [visible, timeZone]);

  const live = visible.filter((item) => item.status !== "cancelled");
  const days = Array.from({ length: 7 }, (_, index) => addDays(week, index));
  const all = [...props.appointments, ...props.pending];
  const selected = all.find((item) => item.id === selectedId) ?? null;
  const weekLabel = `${formatDayShort(week)} – ${formatDayShort(addDays(week, 6))}`;

  function changeStatus(item: Appointment, status: AppointmentStatus, message: string) {
    if (status === "cancelled") {
      const who = item.client?.name ?? "this client";
      const note = item.client?.email ? ` We'll email ${who} to let them know.` : "";
      if (!window.confirm(`Cancel ${who}'s ${item.serviceName}?${note}`)) return;
    }
    run(() => setAppointmentStatus(item.id, status), message);
  }

  return (
    <>
      {props.pending.length ? (
        <Panel
          title="Waiting for you to confirm"
          description="Clients asked for these times. They get an email when you confirm or decline."
          className="border-amber-200"
        >
          <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
            {props.pending.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button type="button" onClick={() => setSelectedId(item.id)} className="min-w-0 flex-1 text-left">
                  <p className="font-medium">
                    {item.client?.name ?? "Client"} · {item.serviceName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDayLong(zonedParts(new Date(item.startsAt), timeZone).ymd)}, {formatClock(item.startsAt, timeZone)}
                    {item.staffName ? ` with ${item.staffName}` : ""}
                  </p>
                </button>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={saving}
                    onClick={() => changeStatus(item, "cancelled", "Request declined")}>
                    Decline
                  </Button>
                  <Button size="sm" disabled={saving} onClick={() => changeStatus(item, "confirmed", "Appointment confirmed")}>
                    Confirm
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Previous week" onClick={() => go({ week: addDays(week, -7) })}>
              <ChevronLeftIcon />
            </Button>
            <h2 className="min-w-[150px] text-center text-base font-semibold font-tabular">{weekLabel}</h2>
            <Button variant="ghost" size="icon" aria-label="Next week" onClick={() => go({ week: addDays(week, 7) })}>
              <ChevronRightIcon />
            </Button>
            {today < week || today > addDays(week, 6) ? (
              <Button variant="outline" size="sm" className="ml-2" onClick={() => go({ week: null })}>
                This week
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {live.length} appointment{live.length === 1 ? "" : "s"}
            </p>
            {cancelledCount ? (
              <Button variant="ghost" size="sm" aria-pressed={showCancelled} onClick={() => setShowCancelled((on) => !on)}>
                {showCancelled ? "Hide cancelled" : `Show cancelled (${cancelledCount})`}
              </Button>
            ) : null}
            {props.staff.length > 1 ? (
              <Select value={props.staffFilter} onValueChange={(value) => go({ staff: value === "all" ? null : value })}>
                <SelectTrigger className="w-44" aria-label="Show appointments for">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Whole team</SelectItem>
                  {props.staff.map((person) => (
                    <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>

        <ol className="grid gap-6">
          {days.map((day) => {
            const items = byDay.get(day) ?? [];
            const isToday = day === today;
            const isPast = day < today;
            return (
              <li key={day}>
                <div className="mb-2 flex items-baseline gap-2">
                  <h3 className={cn("text-sm font-semibold", isPast && "text-muted-foreground")}>{formatDayLong(day)}</h3>
                  {isToday ? <Badge className="bg-brand text-white">Today</Badge> : null}
                </div>
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-black/8 px-4 py-3 text-sm text-muted-foreground">
                    Nothing booked
                  </p>
                ) : (
                  <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
                    {items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className={cn(
                            "flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left transition hover:bg-mist",
                            item.status === "cancelled" && "opacity-60"
                          )}
                        >
                          <span className="w-36 shrink-0 whitespace-nowrap text-sm font-medium font-tabular">
                            {formatClock(item.startsAt, timeZone)} – {formatClock(item.endsAt, timeZone)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{item.client?.name ?? "Client removed"}</span>
                            <span className="block truncate text-sm text-muted-foreground">
                              {item.serviceName}
                              {item.staffName ? ` · ${item.staffName}` : ""}
                            </span>
                          </span>
                          {item.internalNotes || item.clientNotes ? (
                            <StickyNoteIcon className="size-4 text-muted-foreground" aria-label="Has notes" />
                          ) : null}
                          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_STYLE[item.status])}>
                            {SHORT_STATUS[item.status]}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </Panel>

      <AppointmentSheet
        appointment={selected}
        timeZone={timeZone}
        saving={saving}
        onClose={() => setSelectedId(null)}
        onStatus={changeStatus}
        onSaveNotes={(item, notes) => run(() => saveInternalNotes(item.id, notes), "Notes saved")}
        onMarkDepositPaid={(item) => run(() => markDepositPaid(item.id), "Deposit marked as paid")}
        onRecordRefund={(item, amountCents) => run(() => recordRefund(item.id, amountCents), "Refund recorded")}
      />

      <NewAppointmentSheet
        open={creating}
        today={today}
        staff={props.staff}
        services={props.services}
        defaultStaff={props.staffFilter !== "all" ? props.staffFilter : props.staff[0]?.id ?? ""}
        saving={saving}
        onClose={() => {
          setCreating(false);
          if (props.openNew) go({ new: null });
        }}
        onCreate={(input, reset) =>
          run(() => createManualAppointment(input), "Appointment added", () => {
            reset();
            setCreating(false);
            go({ new: null, week: input.date >= week && input.date <= addDays(week, 6) ? week : input.date });
          })
        }
      />
    </>
  );
}

function AppointmentSheet({
  appointment,
  timeZone,
  saving,
  onClose,
  onStatus,
  onSaveNotes,
  onMarkDepositPaid,
  onRecordRefund,
}: {
  appointment: Appointment | null;
  timeZone: string;
  saving: boolean;
  onClose: () => void;
  onStatus: (item: Appointment, status: AppointmentStatus, message: string) => void;
  onSaveNotes: (item: Appointment, notes: string) => void;
  onMarkDepositPaid: (item: Appointment) => void;
  onRecordRefund: (item: Appointment, amountCents: number) => void;
}) {
  const [notes, setNotes] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  useEffect(() => setNotes(appointment?.internalNotes ?? ""), [appointment?.id, appointment?.internalNotes]);
  useEffect(() => {
    setRefunding(false);
    setRefundAmount(appointment ? (appointment.depositCents / 100).toFixed(2) : "");
  }, [appointment?.id]);

  const started = appointment ? new Date(appointment.startsAt).getTime() <= Date.now() : false;
  const day = appointment ? zonedParts(new Date(appointment.startsAt), timeZone).ymd : "";

  return (
    <Sheet open={appointment !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {appointment ? (
          <div className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>{appointment.client?.name ?? "Client removed"}</SheetTitle>
              <SheetDescription>
                {formatDayLong(day)}, {formatClock(appointment.startsAt, timeZone)} – {formatClock(appointment.endsAt, timeZone)}
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-5 px-4">
              <span className={cn("w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_STYLE[appointment.status])}>
                {STATUS_LABELS[appointment.status]}
                {appointment.status === "cancelled" && appointment.cancelledBy
                  ? appointment.cancelledBy === "client"
                    ? " by the client"
                    : " by you"
                  : ""}
              </span>

              <dl className="grid gap-3 text-sm">
                <Detail label="Service">{appointment.serviceName}</Detail>
                <Detail label="With">{appointment.staffName ?? "Not assigned"}</Detail>
                <Detail label="Length">
                  {formatDuration(Math.round((new Date(appointment.endsAt).getTime() - new Date(appointment.startsAt).getTime()) / 60_000))}
                </Detail>
                {appointment.priceCents != null ? (
                  <Detail label="Price">{formatMoney(appointment.priceCents, appointment.currency)}</Detail>
                ) : null}
                {appointment.depositCents > 0 ? (
                  <Detail label="Deposit">
                    {formatMoney(appointment.depositCents, appointment.currency)} · {DEPOSIT_LABEL[appointment.depositStatus]}
                  </Detail>
                ) : null}
                {appointment.refundCents > 0 ? (
                  <Detail label="Refunded">{formatMoney(appointment.refundCents, appointment.currency)}</Detail>
                ) : null}
                <Detail label="Booked">{appointment.source === "online" ? "Online by the client" : "Added by you"}</Detail>
              </dl>

              {appointment.client ? (
                <div className="grid gap-2 text-sm">
                  {appointment.client.phone ? (
                    <a href={`tel:${appointment.client.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:underline">
                      <PhoneIcon className="size-4 text-muted-foreground" /> {appointment.client.phone}
                    </a>
                  ) : null}
                  {appointment.client.email ? (
                    <a href={`mailto:${appointment.client.email}`} className="flex items-center gap-2 hover:underline">
                      <MailIcon className="size-4 text-muted-foreground" /> {appointment.client.email}
                    </a>
                  ) : null}
                </div>
              ) : null}

              {appointment.clientNotes ? (
                <div className="rounded-xl bg-mist px-4 py-3 text-sm">
                  <p className="font-medium">From the client</p>
                  <p className="mt-1 whitespace-pre-line text-muted-foreground">{appointment.clientNotes}</p>
                </div>
              ) : null}

              <Field id="appt-notes" label="Your notes" description="Only you see these.">
                <Textarea id="appt-notes" value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} />
              </Field>
              {notes !== appointment.internalNotes ? (
                <Button variant="outline" size="sm" className="w-fit" disabled={saving}
                  onClick={() => onSaveNotes(appointment, notes)}>
                  Save notes
                </Button>
              ) : null}
            </div>

            <SheetFooter className="mt-auto flex-col gap-2 sm:flex-col">
              {appointment.depositCents > 0 && (appointment.depositStatus === "pending" || appointment.depositStatus === "none") ? (
                <Button size="lg" variant="outline" disabled={saving} onClick={() => onMarkDepositPaid(appointment)}>
                  Mark deposit as paid
                </Button>
              ) : null}
              {appointment.depositCents > 0 && appointment.depositStatus === "paid" ? (
                refunding ? (
                  <div className="grid gap-2">
                    <Field id="refund-amount" label="Amount refunded">
                      <Input
                        id="refund-amount"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={refundAmount}
                        onChange={(event) => setRefundAmount(event.target.value)}
                      />
                    </Field>
                    <div className="flex gap-2">
                      <Button
                        size="lg"
                        disabled={saving || !(Number(refundAmount) > 0)}
                        onClick={() => onRecordRefund(appointment, Math.round(Number(refundAmount) * 100))}
                      >
                        Confirm refund
                      </Button>
                      <Button size="lg" variant="outline" disabled={saving} onClick={() => setRefunding(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="lg" variant="outline" disabled={saving} onClick={() => setRefunding(true)}>
                    Record a refund
                  </Button>
                )
              ) : null}
              {appointment.status === "pending" ? (
                <Button size="lg" disabled={saving} onClick={() => onStatus(appointment, "confirmed", "Appointment confirmed")}>
                  Confirm appointment
                </Button>
              ) : null}
              {appointment.status === "confirmed" && started ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button size="lg" disabled={saving} onClick={() => onStatus(appointment, "completed", "Marked as completed")}>
                    Completed
                  </Button>
                  <Button size="lg" variant="outline" disabled={saving}
                    onClick={() => onStatus(appointment, "no_show", "Marked as a no-show")}>
                    No-show
                  </Button>
                </div>
              ) : null}
              {appointment.status === "completed" || appointment.status === "no_show" ? (
                <Button size="lg" variant="outline" disabled={saving}
                  onClick={() => onStatus(appointment, "confirmed", "Status reset")}>
                  Undo: mark as not yet done
                </Button>
              ) : null}
              {appointment.status === "pending" || appointment.status === "confirmed" ? (
                <Button size="lg" variant="ghost" className="text-destructive hover:text-destructive" disabled={saving}
                  onClick={() => onStatus(appointment, "cancelled", "Appointment cancelled")}>
                  Cancel appointment
                </Button>
              ) : null}
            </SheetFooter>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function NewAppointmentSheet({
  open,
  today,
  staff,
  services,
  defaultStaff,
  saving,
  onClose,
  onCreate,
}: {
  open: boolean;
  today: string;
  staff: StaffMember[];
  services: Service[];
  defaultStaff: string;
  saving: boolean;
  onClose: () => void;
  onCreate: (input: ManualAppointmentInput, reset: () => void) => void;
}) {
  const blank = (): ManualAppointmentInput => ({
    serviceId: services[0]?.id ?? "",
    staffId: defaultStaff,
    date: today,
    time: "10:00",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    notes: "",
  });
  const [draft, setDraft] = useState<ManualAppointmentInput>(blank);
  const set = <K extends keyof ManualAppointmentInput>(key: K, value: ManualAppointmentInput[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));
  const missing = !services.length ? "Add a service first." : !staff.length ? "Add a team member first." : null;

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <form
          className="flex h-full flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate(draft, () => setDraft(blank()));
          }}
        >
          <SheetHeader>
            <SheetTitle>New appointment</SheetTitle>
            <SheetDescription>For bookings by phone, message or in person. It can be outside your usual hours.</SheetDescription>
          </SheetHeader>
          {missing ? (
            <div className="px-4">
              <EmptyState title={missing} />
            </div>
          ) : (
            <div className="grid gap-5 px-4">
              <Field id="new-client" label="Client name">
                <Input id="new-client" required maxLength={120} value={draft.clientName}
                  onChange={(event) => set("clientName", event.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="new-phone" label="Phone">
                  <Input id="new-phone" type="tel" value={draft.clientPhone} onChange={(event) => set("clientPhone", event.target.value)} />
                </Field>
                <Field id="new-email" label="Email">
                  <Input id="new-email" type="email" value={draft.clientEmail} onChange={(event) => set("clientEmail", event.target.value)} />
                </Field>
              </div>
              <Field id="new-service" label="Service">
                <Select value={draft.serviceId} onValueChange={(value) => set("serviceId", value)}>
                  <SelectTrigger id="new-service" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({formatDuration(service.durationMinutes)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="new-staff" label="With">
                <Select value={draft.staffId} onValueChange={(value) => set("staffId", value)}>
                  <SelectTrigger id="new-staff" className="w-full"><SelectValue placeholder="Choose a team member" /></SelectTrigger>
                  <SelectContent>
                    {staff.map((person) => (
                      <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="new-date" label="Date">
                  <Input id="new-date" type="date" required value={draft.date} onChange={(event) => set("date", event.target.value)} />
                </Field>
                <Field id="new-time" label="Start time">
                  <Input id="new-time" type="time" required step={300} value={draft.time} onChange={(event) => set("time", event.target.value)} />
                </Field>
              </div>
              <Field id="new-notes" label="Notes" description="Only you see these.">
                <Textarea id="new-notes" maxLength={2000} value={draft.notes} onChange={(event) => set("notes", event.target.value)} />
              </Field>
            </div>
          )}
          <SheetFooter>
            <Button type="submit" size="lg" disabled={saving || Boolean(missing)}>
              {saving ? "Adding…" : "Add appointment"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
