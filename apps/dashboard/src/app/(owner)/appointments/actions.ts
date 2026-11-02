"use server";

import { revalidatePath } from "next/cache";
import {
  bookingRulesFromRow,
  formatWhen,
  isYmd,
  minutesOfDay,
  safeTimeZone,
  zonedTimeToInstant,
} from "@glamsite/shared/booking";
import { siteLink } from "@glamsite/shared/domain";
import { clientBookingEmail, clientCancelledEmail, sendEmail, type BookingEmailDetails } from "@glamsite/shared/email";
import { formatAddress, formatMoney } from "@glamsite/shared/format";
import { appointmentFromRow } from "@glamsite/shared/mappers";
import { getWebUrl } from "@glamsite/shared/supabase/env";
import type { AppointmentStatus, Business } from "@glamsite/shared/types";
import { dbError, fail, ownerContext, type ActionResult, type ServerClient } from "@/lib/business";

/** Which status changes an owner can make from each status. */
const NEXT: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "no_show", "cancelled"],
  completed: ["confirmed", "no_show"],
  no_show: ["confirmed", "completed"],
  cancelled: [],
};

const done = (): ActionResult => {
  revalidatePath("/", "layout");
  return { ok: true };
};

/** Email the client about a change the owner made. Best effort: the change stands either way. */
async function notifyClient(
  supabase: ServerClient,
  business: Business,
  appointmentId: string,
  kind: "confirmed" | "cancelled"
) {
  const [{ data: row }, { data: settings }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, clients(name, email, phone), staff(name)")
      .eq("id", appointmentId)
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase.from("booking_settings").select("*").eq("business_id", business.id).maybeSingle(),
  ]);
  if (!row) return;
  const appointment = appointmentFromRow(row);
  if (!appointment.client?.email) return;

  const rules = bookingRulesFromRow(settings);
  const webUrl = getWebUrl();
  const details: BookingEmailDetails = {
    businessName: business.name,
    businessPhone: business.phone,
    businessAddress: formatAddress(business.address),
    serviceName: appointment.serviceName,
    when: formatWhen(appointment.startsAt, business.timezone),
    staffName: appointment.staffName,
    priceText: appointment.priceCents == null ? null : formatMoney(appointment.priceCents, appointment.currency),
    clientName: appointment.client.name,
    clientEmail: appointment.client.email,
    clientPhone: appointment.client.phone,
    clientNotes: appointment.clientNotes,
    status: kind,
    manageUrl: siteLink(business, `/appointment/${row.manage_token as string}`, webUrl),
    cancellationNoticeHours: rules.cancellationNoticeHours,
  };
  const message =
    kind === "confirmed"
      ? clientBookingEmail(details)
      : clientCancelledEmail(details, true, siteLink(business, "/book", webUrl));
  await sendEmail({ to: appointment.client.email, ...message, fromName: business.name, replyTo: business.email });
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { supabase, business } = ctx;

  const { data: current, error: readError } = await supabase
    .from("appointments")
    .select("status, starts_at")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (readError) return dbError("read appointment", readError);
  if (!current) return fail("That appointment no longer exists.");

  const from = current.status as AppointmentStatus;
  if (from === status) return { ok: true };
  if (!NEXT[from]?.includes(status)) return fail("That change isn't possible for this appointment.");
  if ((status === "completed" || status === "no_show") && new Date(current.starts_at as string).getTime() > Date.now()) {
    return fail("You can mark this once the appointment has started.");
  }

  const update: Record<string, unknown> = { status };
  if (status === "cancelled") {
    update.cancelled_at = new Date().toISOString();
    update.cancelled_by = "business";
  }
  const { error } = await supabase
    .from("appointments")
    .update(update)
    .eq("id", id)
    .eq("business_id", business.id)
    .eq("status", from);
  if (error) {
    if (error.code === "23P01") return fail("Someone else is booked with this person at that time.");
    return dbError("update appointment status", error);
  }

  // Only tell the client about changes that affect them, and not about past appointments.
  const upcoming = new Date(current.starts_at as string).getTime() > Date.now();
  if (upcoming && from === "pending" && status === "confirmed") await notifyClient(supabase, business, id, "confirmed");
  if (upcoming && status === "cancelled") await notifyClient(supabase, business, id, "cancelled");

  return done();
}

/** Owner collected a deposit/payment in person (cash, card machine, phone) rather than online. */
export async function markDepositPaid(id: string): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { supabase, business } = ctx;

  const { error } = await supabase
    .from("appointments")
    .update({ deposit_status: "paid" })
    .eq("id", id)
    .eq("business_id", business.id)
    .in("deposit_status", ["none", "pending"]);
  if (error) return dbError("update deposit status", error);
  return done();
}

export async function saveInternalNotes(id: string, notes: string): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase
    .from("appointments")
    .update({ internal_notes: notes.trim().slice(0, 2000) })
    .eq("id", id)
    .eq("business_id", ctx.business.id);
  return error ? dbError("save appointment notes", error) : done();
}

export type ManualAppointmentInput = {
  serviceId: string;
  staffId: string;
  /** "YYYY-MM-DD" and "HH:MM", local to the business. */
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * An appointment the owner adds by hand (phone or walk-in). It can be outside
 * working hours, but never on top of another appointment for the same person.
 */
export async function createManualAppointment(input: ManualAppointmentInput): Promise<ActionResult> {
  const ctx = await ownerContext();
  if (!ctx.ok) return ctx;
  const { supabase, business } = ctx;

  const name = input.clientName.trim().slice(0, 120);
  const email = input.clientEmail.trim().toLowerCase().slice(0, 254);
  const phone = input.clientPhone.trim().slice(0, 40);
  if (!name) return fail("Add the client's name.");
  if (email && !EMAIL_RE.test(email)) return fail("That email address doesn't look right.");
  if (!isYmd(input.date)) return fail("Choose a date.");
  const minutes = minutesOfDay(input.time);
  if (Number.isNaN(minutes)) return fail("Choose a time.");

  const [{ data: service }, { data: person }] = await Promise.all([
    supabase.from("services").select("*").eq("id", input.serviceId).eq("business_id", business.id).maybeSingle(),
    supabase.from("staff").select("id").eq("id", input.staffId).eq("business_id", business.id).maybeSingle(),
  ]);
  if (!service) return fail("Choose a service.");
  if (!person) return fail("Choose who the appointment is with.");

  const startsAt = zonedTimeToInstant(input.date, minutes, safeTimeZone(business.timezone));
  const endsAt = new Date(startsAt.getTime() + Number(service.duration_minutes) * 60_000);

  const { data: clientId, error: clientError } = await supabase.rpc("upsert_booking_client", {
    p_business_id: business.id,
    p_name: name,
    p_email: email,
    p_phone: phone,
  });
  if (clientError || !clientId) return dbError("save client", clientError);

  const { error } = await supabase.from("appointments").insert({
    business_id: business.id,
    client_id: clientId,
    service_id: service.id,
    staff_id: person.id,
    service_name: service.name,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "confirmed",
    price_cents: service.price_cents,
    currency: business.currency,
    source: "manual",
    internal_notes: input.notes.trim().slice(0, 2000),
  });
  if (error) {
    if (error.code === "23P01") return fail("That person already has an appointment at that time.");
    return dbError("add appointment", error);
  }
  return done();
}
