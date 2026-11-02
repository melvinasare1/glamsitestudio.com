/**
 * Public online booking (server only: uses the service role).
 *
 * Clients have no accounts. Everything here is scoped to one live business
 * whose booking mode is "glamsite", looked up by slug, and every query
 * filters by that business id (rule 7). The availability engine in
 * @glamsite/shared/booking decides which times are offered; the database's
 * no-double-booking rule settles races between two clients.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ACTIVE_STATUSES,
  addDays,
  availableSlots,
  bookableWindow,
  bookingRulesFromRow,
  canClientCancel,
  formatWhen,
  isYmd,
  pickStaff,
  safeTimeZone,
  staffForService,
  weeklyBlocksFor,
  zonedParts,
  zonedTimeToInstant,
  type BookingRules,
  type BusyPeriod,
  type Slot,
} from "@glamsite/shared/booking";
import { siteLink } from "@glamsite/shared/domain";
import {
  clientBookingEmail,
  clientCancelledEmail,
  ownerClientCancelledEmail,
  ownerNewBookingEmail,
  sendEmail,
  type BookingEmailDetails,
} from "@glamsite/shared/email";
import { formatAddress, formatServicePrice } from "@glamsite/shared/format";
import {
  appointmentFromRow,
  businessFromRow,
  categoryFromRow,
  openingHoursFromRow,
  serviceFromRow,
  staffFromRow,
  workingHoursFromRow,
} from "@glamsite/shared/mappers";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { getDashboardUrl, getWebUrl } from "@glamsite/shared/supabase/env";
import type {
  Appointment,
  Business,
  OpeningHours,
  Service,
  ServiceCategory,
  StaffMember,
  StaffWorkingHours,
} from "@glamsite/shared/types";

export type BookingSite = {
  business: Business;
  rules: BookingRules;
  categories: ServiceCategory[];
  /** Visible, bookable services. */
  services: Service[];
  /** Bookable team members. */
  staff: StaffMember[];
  openingHours: OpeningHours[];
  workingHours: StaffWorkingHours[];
};

export type LoadResult =
  | { ok: true; site: BookingSite }
  | { ok: false; reason: "not_found" | "not_enabled" | "unavailable"; business?: Business };

function admin(): SupabaseClient | null {
  try {
    return createAdminClient();
  } catch (error) {
    console.error("[booking] service role missing", error);
    return null;
  }
}

/** Everything needed to offer online booking for one live site. */
export async function loadBookingSite(slug: string): Promise<LoadResult> {
  const supabase = admin();
  if (!supabase) return { ok: false, reason: "unavailable" };

  const { data: row, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();
  if (error) {
    console.error("[booking] business lookup failed", { slug, error: error.message });
    return { ok: false, reason: "unavailable" };
  }
  if (!row) return { ok: false, reason: "not_found" };

  const business = businessFromRow(row);
  if (business.bookingMode !== "glamsite") return { ok: false, reason: "not_enabled", business };

  const id = business.id;
  const [settings, categories, services, staff, opening, working] = await Promise.all([
    supabase.from("booking_settings").select("*").eq("business_id", id).maybeSingle(),
    supabase.from("service_categories").select("*").eq("business_id", id).order("position"),
    supabase
      .from("services")
      .select("*")
      .eq("business_id", id)
      .eq("is_visible", true)
      .eq("is_bookable", true)
      .order("position"),
    supabase
      .from("staff")
      .select("*, staff_services(service_id)")
      .eq("business_id", id)
      .eq("is_bookable", true)
      .order("position"),
    supabase.from("opening_hours").select("*").eq("business_id", id),
    supabase.from("staff_working_hours").select("*").eq("business_id", id),
  ]);

  for (const result of [settings, categories, services, staff, opening, working]) {
    if (result.error) {
      console.error("[booking] load failed", { slug, error: result.error.message });
      return { ok: false, reason: "unavailable", business };
    }
  }

  return {
    ok: true,
    site: {
      business,
      rules: bookingRulesFromRow(settings.data),
      categories: (categories.data ?? []).map(categoryFromRow),
      services: (services.data ?? []).map(serviceFromRow),
      staff: (staff.data ?? []).map(staffFromRow),
      openingHours: (opening.data ?? []).map(openingHoursFromRow),
      workingHours: (working.data ?? []).map(workingHoursFromRow),
    },
  };
}

/** Team members who can take this service, optionally narrowed to one person. */
function eligibleStaff(site: BookingSite, serviceId: string, staffId: string | null): StaffMember[] {
  const team = staffForService(site.staff, serviceId);
  return staffId ? team.filter((person) => person.id === staffId) : team;
}

type SearchResult = {
  slots: Slot[];
  /** Live appointments per team member per local day, for spreading "anyone" bookings. */
  dayCounts: Record<string, Record<string, number>>;
};

async function search(
  supabase: SupabaseClient,
  site: BookingSite,
  service: Service,
  staff: StaffMember[],
  from: string,
  to: string
): Promise<SearchResult | null> {
  const timeZone = safeTimeZone(site.business.timezone);
  if (!staff.length) return { slots: [], dayCounts: {} };

  // A day either side covers buffers and appointments that cross midnight.
  const rangeStart = zonedTimeToInstant(addDays(from, -1), 0, timeZone).toISOString();
  const rangeEnd = zonedTimeToInstant(addDays(to, 2), 0, timeZone).toISOString();
  const staffIds = staff.map((person) => person.id);

  const [appointments, timeOff] = await Promise.all([
    supabase
      .from("appointments")
      .select("staff_id, starts_at, ends_at, services(buffer_minutes)")
      .eq("business_id", site.business.id)
      .in("status", ACTIVE_STATUSES)
      .in("staff_id", staffIds)
      .lt("starts_at", rangeEnd)
      .gt("ends_at", rangeStart),
    supabase
      .from("staff_time_off")
      .select("staff_id, starts_at, ends_at")
      .eq("business_id", site.business.id)
      .or(`staff_id.is.null,staff_id.in.(${staffIds.join(",")})`)
      .lt("starts_at", rangeEnd)
      .gt("ends_at", rangeStart),
  ]);
  if (appointments.error || timeOff.error) {
    console.error("[booking] availability query failed", appointments.error ?? timeOff.error);
    return null;
  }

  const busy: BusyPeriod[] = [];
  const dayCounts: Record<string, Record<string, number>> = {};
  for (const row of appointments.data ?? []) {
    const embedded = Array.isArray(row.services) ? row.services[0] : row.services;
    const buffer = Number((embedded as { buffer_minutes?: number } | null)?.buffer_minutes ?? 0) || 0;
    const ends = new Date(new Date(row.ends_at as string).getTime() + buffer * 60_000).toISOString();
    busy.push({ staffId: row.staff_id as string, startsAt: row.starts_at as string, endsAt: ends });

    const day = zonedParts(new Date(row.starts_at as string), timeZone).ymd;
    const counts = (dayCounts[day] ??= {});
    counts[row.staff_id as string] = (counts[row.staff_id as string] ?? 0) + 1;
  }
  for (const row of timeOff.data ?? []) {
    busy.push({ staffId: (row.staff_id as string | null) ?? null, startsAt: row.starts_at as string, endsAt: row.ends_at as string });
  }

  const slots = availableSlots({
    timeZone,
    rules: site.rules,
    service: { durationMinutes: service.durationMinutes, bufferMinutes: service.bufferMinutes },
    staff: staff.map((person) => ({
      staffId: person.id,
      blocks: weeklyBlocksFor(person.id, site.workingHours, site.openingHours),
    })),
    busy,
    from,
    to,
  });
  return { slots, dayCounts };
}

export type SlotsResponse =
  | { ok: true; slots: { startsAt: string; date: string; time: string }[]; first: string; last: string }
  | { ok: false; error: string; status: number };

/** Bookable times for a service between two dates (local to the business). */
export async function getSlots(
  site: BookingSite,
  serviceId: string,
  staffId: string | null,
  from: string,
  to: string
): Promise<SlotsResponse> {
  const supabase = admin();
  if (!supabase) return { ok: false, error: "Booking isn't available right now.", status: 503 };
  if (!isYmd(from) || !isYmd(to) || to < from) return { ok: false, error: "Choose valid dates.", status: 400 };

  const service = site.services.find((item) => item.id === serviceId);
  if (!service) return { ok: false, error: "That service can't be booked online.", status: 404 };

  const result = await search(supabase, site, service, eligibleStaff(site, serviceId, staffId), from, to);
  if (!result) return { ok: false, error: "Couldn't load times. Please try again.", status: 500 };

  const window = bookableWindow(safeTimeZone(site.business.timezone), site.rules);
  return {
    ok: true,
    // Which person takes "anyone" is decided when booking, so it isn't sent.
    slots: result.slots.map(({ startsAt, date, time }) => ({ startsAt, date, time })),
    first: window.first,
    last: window.last,
  };
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export type BookingRequest = {
  slug: string;
  serviceId: string;
  staffId: string | null;
  startsAt: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

function text(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

/** Checks a booking form post. `website` is a honeypot real visitors never fill in. */
export function parseBookingRequest(
  raw: unknown
): { ok: true; data: BookingRequest } | { ok: false; error: string; bot?: boolean } {
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  if (text(body.website, 200)) return { ok: false, error: "Rejected.", bot: true };

  const slug = text(body.slug, 63);
  const serviceId = text(body.serviceId, 36);
  const staffRaw = text(body.staffId, 36);
  const startsAt = text(body.startsAt, 40);
  const name = text(body.name, 120);
  const email = text(body.email, 254).toLowerCase();
  const phone = text(body.phone, 40);
  const notes = text(body.notes, 1000);

  if (!slug || !isUuid(serviceId)) return { ok: false, error: "Choose a service." };
  if (staffRaw && !isUuid(staffRaw)) return { ok: false, error: "Choose who you'd like to see." };
  if (!startsAt || Number.isNaN(new Date(startsAt).getTime())) return { ok: false, error: "Choose a time." };
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: "Please enter a phone number." };

  return {
    ok: true,
    data: { slug, serviceId, staffId: staffRaw || null, startsAt: new Date(startsAt).toISOString(), name, email, phone, notes },
  };
}

export type BookingOutcome =
  | { ok: true; token: string; status: "pending" | "confirmed" }
  | { ok: false; error: string; status: number; code?: "slot_taken" };

const TAKEN: BookingOutcome = {
  ok: false,
  error: "That time is no longer available. Please choose another.",
  status: 409,
  code: "slot_taken",
};

async function ownerEmail(supabase: SupabaseClient, business: Business): Promise<string> {
  if (business.email.trim()) return business.email.trim();
  const { data } = await supabase.auth.admin.getUserById(business.ownerId);
  return data.user?.email ?? "";
}

function emailDetails(
  business: Business,
  rules: BookingRules,
  appointment: Pick<Appointment, "serviceName" | "startsAt" | "staffName" | "priceCents" | "clientNotes">,
  client: { name: string; email: string; phone: string },
  status: BookingEmailDetails["status"],
  token: string,
  priceIsFrom = false
): BookingEmailDetails {
  return {
    businessName: business.name,
    businessPhone: business.phone,
    businessAddress: formatAddress(business.address),
    serviceName: appointment.serviceName,
    when: formatWhen(appointment.startsAt, business.timezone),
    staffName: appointment.staffName,
    priceText:
      appointment.priceCents == null
        ? null
        : formatServicePrice({ priceCents: appointment.priceCents, priceIsFrom }, business.currency),
    clientName: client.name,
    clientEmail: client.email,
    clientPhone: client.phone,
    clientNotes: appointment.clientNotes,
    status,
    manageUrl: siteLink(business, `/appointment/${token}`, getWebUrl()),
    cancellationNoticeHours: rules.cancellationNoticeHours,
  };
}

/** Book an appointment for a client. Re-checks the time against live availability first. */
export async function createBooking(site: BookingSite, request: BookingRequest): Promise<BookingOutcome> {
  const supabase = admin();
  if (!supabase) return { ok: false, error: "Booking isn't available right now.", status: 503 };

  const { business, rules } = site;
  const service = site.services.find((item) => item.id === request.serviceId);
  if (!service) return { ok: false, error: "That service can't be booked online.", status: 404 };

  const staff = eligibleStaff(site, service.id, request.staffId);
  if (!staff.length) return { ok: false, error: "That person isn't taking online bookings for this service.", status: 400 };

  const timeZone = safeTimeZone(business.timezone);
  const day = zonedParts(new Date(request.startsAt), timeZone).ymd;
  const result = await search(supabase, site, service, staff, day, day);
  if (!result) return { ok: false, error: "Couldn't check that time. Please try again.", status: 500 };

  const slot = result.slots.find((item) => item.startsAt === request.startsAt);
  if (!slot) return TAKEN;

  const clientResult = await supabase.rpc("upsert_booking_client", {
    p_business_id: business.id,
    p_name: request.name,
    p_email: request.email,
    p_phone: request.phone,
  });
  if (clientResult.error || !clientResult.data) {
    console.error("[booking] client upsert failed", clientResult.error);
    return { ok: false, error: "Couldn't save your details. Please try again.", status: 500 };
  }
  const clientId = clientResult.data as string;
  const status = rules.autoConfirm ? "confirmed" : "pending";

  // "Anyone": try the least busy person first, then the others, in case two
  // clients grab the same person at once.
  const candidates = [...slot.staffIds];
  const counts = result.dayCounts[day] ?? {};
  const ordered: string[] = [];
  while (candidates.length) {
    const next = pickStaff(candidates, counts) as string;
    ordered.push(next);
    candidates.splice(candidates.indexOf(next), 1);
  }

  for (const staffId of ordered) {
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        business_id: business.id,
        client_id: clientId,
        service_id: service.id,
        staff_id: staffId,
        service_name: service.name,
        starts_at: slot.startsAt,
        ends_at: slot.endsAt,
        status,
        price_cents: service.priceCents,
        currency: business.currency,
        source: "online",
        client_notes: request.notes,
      })
      .select("manage_token")
      .single();

    if (error) {
      if (error.code === "23P01") continue; // no_double_booking: someone else got this person first
      console.error("[booking] insert failed", error);
      return { ok: false, error: "Couldn't save your booking. Please try again.", status: 500 };
    }

    const token = data.manage_token as string;
    const staffName = site.staff.find((person) => person.id === staffId)?.name ?? null;
    const details = emailDetails(
      business,
      rules,
      { serviceName: service.name, startsAt: slot.startsAt, staffName, priceCents: service.priceCents, clientNotes: request.notes },
      { name: request.name, email: request.email, phone: request.phone },
      status,
      token,
      service.priceIsFrom
    );
    const dashboardUrl = `${getDashboardUrl()}/appointments`;
    const toClient = clientBookingEmail(details);
    const toOwner = ownerNewBookingEmail(details, dashboardUrl);
    const owner = await ownerEmail(supabase, business);
    await Promise.allSettled([
      sendEmail({ to: request.email, ...toClient, fromName: business.name, replyTo: business.email }),
      owner ? sendEmail({ to: owner, ...toOwner, replyTo: request.email }) : Promise.resolve(false),
    ]);

    return { ok: true, token, status };
  }

  return TAKEN;
}

// ---------------------------------------------------------------------------
// The client's private link: view and cancel
// ---------------------------------------------------------------------------

export type ManagedAppointment = {
  appointment: Appointment;
  business: Business;
  rules: BookingRules;
  canCancel: boolean;
};

export async function getAppointmentByToken(token: string): Promise<ManagedAppointment | null> {
  if (!isUuid(token)) return null;
  const supabase = admin();
  if (!supabase) return null;

  const { data: row, error } = await supabase
    .from("appointments")
    .select("*, clients(name, email, phone), staff(name)")
    .eq("manage_token", token)
    .maybeSingle();
  if (error) console.error("[booking] token lookup failed", error.message);
  if (!row) return null;

  const [businessResult, settings] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", row.business_id).maybeSingle(),
    supabase.from("booking_settings").select("*").eq("business_id", row.business_id).maybeSingle(),
  ]);
  if (!businessResult.data) return null;

  const appointment = appointmentFromRow(row);
  const rules = bookingRulesFromRow(settings.data);
  return {
    appointment,
    business: businessFromRow(businessResult.data),
    rules,
    canCancel: canClientCancel(appointment, rules),
  };
}

export async function cancelByToken(token: string): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const managed = await getAppointmentByToken(token);
  if (!managed) return { ok: false, error: "We couldn't find that booking.", status: 404 };
  const { appointment, business, rules } = managed;

  if (appointment.status === "cancelled") return { ok: true };
  if (!managed.canCancel) {
    const phone = business.phone ? ` Please call ${business.phone}.` : " Please contact the salon.";
    return { ok: false, error: `It's too late to cancel online.${phone}`, status: 409 };
  }

  const supabase = admin();
  if (!supabase) return { ok: false, error: "Please try again in a moment.", status: 503 };

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: "client" })
    .eq("id", appointment.id)
    .eq("business_id", business.id)
    .in("status", ACTIVE_STATUSES);
  if (error) {
    console.error("[booking] cancel failed", error);
    return { ok: false, error: "Couldn't cancel. Please try again.", status: 500 };
  }

  const client = appointment.client ?? { name: "", email: "", phone: "" };
  const details = emailDetails(business, rules, appointment, client, "cancelled", token);
  const owner = await ownerEmail(supabase, business);
  await Promise.allSettled([
    client.email
      ? sendEmail({
          to: client.email,
          ...clientCancelledEmail(details, false, siteLink(business, "/book", getWebUrl())),
          fromName: business.name,
          replyTo: business.email,
        })
      : Promise.resolve(false),
    owner
      ? sendEmail({ to: owner, ...ownerClientCancelledEmail(details, `${getDashboardUrl()}/appointments`) })
      : Promise.resolve(false),
  ]);

  return { ok: true };
}
