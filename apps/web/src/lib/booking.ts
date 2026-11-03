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
  depositAmountCents,
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
import { canSendWithinQuota, isEmailTypeEnabled, monthlyEmailQuota, platformFeeCents } from "@glamsite/shared/billing";
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
import { getStripe } from "@glamsite/shared/stripe";
import {
  appointmentFromRow,
  billingFromRow,
  businessFromRow,
  categoryFromRow,
  emailNotificationSettingsFromRow,
  emailUsageFromRow,
  openingHoursFromRow,
  serviceFromRow,
  staffFromRow,
  workingHoursFromRow,
} from "@glamsite/shared/mappers";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { trackServer } from "@/lib/server-track";
import { getDashboardUrl, getWebUrl } from "@glamsite/shared/supabase/env";
import type {
  Appointment,
  Business,
  EmailNotificationSettings,
  EmailType,
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

/**
 * Releases slots held by a Checkout session nobody completed. Called from
 * both read (getSlots) and write (createBooking) paths instead of a cron —
 * the `appointments_no_double_booking` exclusion only blocks pending/confirmed
 * rows, so cancelling here is enough to free the time.
 */
async function expirePendingPayments(supabase: SupabaseClient, businessId: string): Promise<void> {
  const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .eq("status", "pending")
    .eq("deposit_status", "pending")
    .not("stripe_payment_intent_id", "is", null)
    .lt("created_at", cutoff);
  if (error) console.error("[booking] expire pending payments failed", error);
}

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
  await expirePendingPayments(supabase, site.business.id);

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
/** Matches the `code` check constraint on discount_codes. */
const DISCOUNT_CODE_RE = /^[A-Za-z0-9-]{1,40}$/;

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
  /** A code the client typed in, if any. Only meaningful when payment is due. */
  discountCode: string | null;
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
  const discountCodeRaw = text(body.discountCode, 40);

  if (!slug || !isUuid(serviceId)) return { ok: false, error: "Choose a service." };
  if (staffRaw && !isUuid(staffRaw)) return { ok: false, error: "Choose who you'd like to see." };
  if (!startsAt || Number.isNaN(new Date(startsAt).getTime())) return { ok: false, error: "Choose a time." };
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: "Please enter a phone number." };
  if (discountCodeRaw && !DISCOUNT_CODE_RE.test(discountCodeRaw)) return { ok: false, error: "That code isn't valid." };

  return {
    ok: true,
    data: {
      slug,
      serviceId,
      staffId: staffRaw || null,
      startsAt: new Date(startsAt).toISOString(),
      name,
      email,
      phone,
      notes,
      discountCode: discountCodeRaw || null,
    },
  };
}

export type BookingOutcome =
  | { ok: true; token: string; status: "pending" | "confirmed" }
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string; status: number; code?: "slot_taken" | "invalid_discount" };

function stripeObjectId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

const TAKEN: BookingOutcome = {
  ok: false,
  error: "That time is no longer available. Please choose another.",
  status: 409,
  code: "slot_taken",
};

type DiscountMatch = { id: string; code: string; discountCents: number; redemptionCount: number };

/**
 * Looks up a code for this business and checks it's usable right now. Codes
 * are letters/numbers/hyphens only (see the `code` check constraint), so a
 * plain case-insensitive `ilike` is a safe exact match — no wildcard
 * characters to worry about escaping.
 */
async function validateDiscountCode(
  supabase: SupabaseClient,
  businessId: string,
  rawCode: string,
  amountCents: number
): Promise<{ ok: true; match: DiscountMatch } | { ok: false; error: string }> {
  const { data: row, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("business_id", businessId)
    .ilike("code", rawCode)
    .maybeSingle();
  if (error || !row) return { ok: false, error: "That code isn't valid." };
  if (!row.is_active) return { ok: false, error: "That code isn't valid." };
  if (row.expires_at && new Date(row.expires_at as string).getTime() < Date.now()) {
    return { ok: false, error: "That code has expired." };
  }
  const redemptionCount = row.redemption_count as number;
  const maxRedemptions = row.max_redemptions as number | null;
  if (maxRedemptions != null && redemptionCount >= maxRedemptions) {
    return { ok: false, error: "That code has reached its limit." };
  }
  const discountCents =
    row.kind === "percent"
      ? Math.round((amountCents * (row.percent_off as number)) / 100)
      : Math.min(amountCents, row.amount_off_cents as number);
  return { ok: true, match: { id: row.id as string, code: row.code as string, discountCents, redemptionCount } };
}

/**
 * Best-effort redemption count. The `eq("redemption_count", ...)` guard
 * makes a lost race harmless (it just fails silently) rather than letting a
 * code go over its limit; worth revisiting with a database function if
 * discount codes get heavy concurrent use.
 */
async function redeemDiscountCode(supabase: SupabaseClient, match: DiscountMatch): Promise<void> {
  const { error } = await supabase
    .from("discount_codes")
    .update({ redemption_count: match.redemptionCount + 1 })
    .eq("id", match.id)
    .eq("redemption_count", match.redemptionCount);
  if (error) console.error("[booking] discount redemption count failed", error);
}

async function ownerEmail(supabase: SupabaseClient, business: Business): Promise<string> {
  if (business.email.trim()) return business.email.trim();
  const { data } = await supabase.auth.admin.getUserById(business.ownerId);
  return data.user?.email ?? "";
}

const DEFAULT_EMAIL_NOTIFICATION_SETTINGS: Omit<EmailNotificationSettings, "businessId"> = {
  clientBookingConfirmationEnabled: true,
  ownerBookingConfirmationEnabled: true,
  clientCancellationEnabled: true,
  ownerCancellationEnabled: true,
};

/** "2026-11", matching the `year_month` check constraint on `email_usage`. */
function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

type EmailGate = { yearMonth: string; quota: number; remaining: number; tier: ReturnType<typeof billingFromRow>["hostingTier"]; settings: EmailNotificationSettings };

/** One read of the hosting tier, toggle settings and this month's usage, shared by every send in a request. */
async function loadEmailGate(supabase: SupabaseClient, businessId: string): Promise<EmailGate> {
  const yearMonth = currentYearMonth();
  const [{ data: billingRow }, { data: settingsRow }, { data: usageRow }] = await Promise.all([
    supabase.from("business_billing").select("*").eq("business_id", businessId).maybeSingle(),
    supabase.from("email_notification_settings").select("*").eq("business_id", businessId).maybeSingle(),
    supabase.from("email_usage").select("*").eq("business_id", businessId).eq("year_month", yearMonth).maybeSingle(),
  ]);
  const tier = billingRow ? billingFromRow(billingRow).hostingTier : "basic";
  const settings = settingsRow
    ? emailNotificationSettingsFromRow(settingsRow)
    : { businessId, ...DEFAULT_EMAIL_NOTIFICATION_SETTINGS };
  const usageCount = usageRow ? emailUsageFromRow(usageRow).sentCount : 0;
  const quota = monthlyEmailQuota(tier);
  return { yearMonth, quota, remaining: quota - usageCount, tier, settings };
}

/**
 * Which of these email types may actually be sent, in order, consuming one
 * quota slot per allowed type (the quota applies equally to every type).
 */
function allowedEmailTypes(gate: EmailGate, candidates: EmailType[]): Set<EmailType> {
  const allowed = new Set<EmailType>();
  let usageCount = gate.quota - gate.remaining;
  for (const type of candidates) {
    if (!canSendWithinQuota(usageCount, gate.quota)) break;
    if (!isEmailTypeEnabled(gate.tier, gate.settings, type)) continue;
    allowed.add(type);
    usageCount += 1;
  }
  return allowed;
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
  await expirePendingPayments(supabase, business.id);

  const service = site.services.find((item) => item.id === request.serviceId);
  if (!service) return { ok: false, error: "That service can't be booked online.", status: 404 };

  const staff = eligibleStaff(site, service.id, request.staffId);
  if (!staff.length) return { ok: false, error: "That person isn't taking online bookings for this service.", status: 400 };

  // Collect payment via the salon's own Stripe Connect account when it's
  // ready to accept charges; otherwise fall back to today's "we'll contact
  // you to collect it" behavior rather than blocking the booking.
  const amountCents = depositAmountCents(rules.paymentPolicy, service.priceCents, rules.depositFixedCents);
  const { data: connectRow } = await supabase
    .from("business_billing")
    .select("stripe_connect_account_id, stripe_connect_charges_enabled")
    .eq("business_id", business.id)
    .maybeSingle();
  const connectAccountId = connectRow?.stripe_connect_account_id as string | null;
  const chargesEnabled = Boolean(connectRow?.stripe_connect_charges_enabled);
  const wouldCollect = Boolean(amountCents && amountCents > 0 && connectAccountId && chargesEnabled);

  let discountMatch: DiscountMatch | null = null;
  if (wouldCollect && request.discountCode) {
    const validated = await validateDiscountCode(supabase, business.id, request.discountCode, amountCents as number);
    if (!validated.ok) return { ok: false, error: validated.error, status: 400, code: "invalid_discount" };
    discountMatch = validated.match;
  }
  const discountCents = discountMatch?.discountCents ?? 0;
  // null stays null (nothing was ever due); otherwise never below zero.
  const finalAmountCents = amountCents == null ? null : Math.max(0, amountCents - discountCents);
  const collectPayment = Boolean(finalAmountCents && finalAmountCents > 0 && connectAccountId && chargesEnabled);

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
  const finalStatus = rules.autoConfirm ? "confirmed" : "pending";
  const insertStatus = collectPayment ? "pending" : finalStatus;

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
        status: insertStatus,
        price_cents: service.priceCents,
        currency: business.currency,
        deposit_cents: collectPayment ? (finalAmountCents as number) : 0,
        deposit_status: collectPayment ? "pending" : "none",
        source: "online",
        client_notes: request.notes,
        discount_code: discountMatch?.code ?? null,
        discount_cents: discountCents,
      })
      .select("id, manage_token")
      .single();

    if (error) {
      if (error.code === "23P01") continue; // no_double_booking: someone else got this person first
      console.error("[booking] insert failed", error);
      return { ok: false, error: "Couldn't save your booking. Please try again.", status: 500 };
    }

    const token = data.manage_token as string;
    if (discountMatch) await redeemDiscountCode(supabase, discountMatch);
    void trackServer(business.id, "booking_created", {
      serviceId: service.id,
      collectPayment,
      priceCents: service.priceCents,
      discountCents,
    });

    if (collectPayment) {
      try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: request.email,
          line_items: [
            {
              price_data: {
                currency: business.currency.toLowerCase(),
                product_data: { name: `${service.name} at ${business.name}` },
                unit_amount: finalAmountCents as number,
              },
              quantity: 1,
            },
          ],
          payment_intent_data: {
            application_fee_amount: platformFeeCents(finalAmountCents as number),
            transfer_data: { destination: connectAccountId as string },
          },
          metadata: { appointmentId: data.id, finalStatus },
          success_url: siteLink(business, `/appointment/${token}`, getWebUrl()),
          cancel_url: siteLink(business, "/book", getWebUrl()),
        });
        if (!session.url) throw new Error("Checkout session has no url");
        await supabase
          .from("appointments")
          .update({ stripe_payment_intent_id: stripeObjectId(session.payment_intent) })
          .eq("id", data.id);
        return { ok: true, checkoutUrl: session.url };
      } catch (error) {
        console.error("[booking] Connect checkout session failed", error);
        await supabase
          .from("appointments")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", data.id);
        return { ok: false, error: "Couldn't start payment. Please try again.", status: 500 };
      }
    }

    const staffName = site.staff.find((person) => person.id === staffId)?.name ?? null;
    await sendBookingConfirmationEmails(
      supabase,
      business,
      rules,
      { serviceName: service.name, startsAt: slot.startsAt, staffName, priceCents: service.priceCents, clientNotes: request.notes },
      { name: request.name, email: request.email, phone: request.phone },
      finalStatus,
      token,
      service.priceIsFrom
    );

    return { ok: true, token, status: finalStatus };
  }

  return TAKEN;
}

/**
 * Builds and sends the client/owner booking-confirmation emails, respecting
 * the hosting tier's toggles and monthly quota. Shared by createBooking()
 * (paid at the salon, or no payment collected) and the Stripe webhook's
 * confirmBookingPayment() (paid online via Checkout).
 */
export async function sendBookingConfirmationEmails(
  supabase: SupabaseClient,
  business: Business,
  rules: BookingRules,
  appointment: Pick<Appointment, "serviceName" | "startsAt" | "staffName" | "priceCents" | "clientNotes">,
  client: { name: string; email: string; phone: string },
  status: "pending" | "confirmed",
  token: string,
  priceIsFrom = false
): Promise<void> {
  const details = emailDetails(business, rules, appointment, client, status, token, priceIsFrom);
  const dashboardUrl = `${getDashboardUrl()}/appointments`;
  const toClient = clientBookingEmail(details);
  const toOwner = ownerNewBookingEmail(details, dashboardUrl);
  const owner = await ownerEmail(supabase, business);
  const candidates: EmailType[] = owner
    ? ["clientBookingConfirmation", "ownerBookingConfirmation"]
    : ["clientBookingConfirmation"];
  const gate = await loadEmailGate(supabase, business.id);
  const allowed = allowedEmailTypes(gate, candidates);
  const attempts: Promise<unknown>[] = [];
  if (allowed.has("clientBookingConfirmation")) {
    attempts.push(sendEmail({ to: client.email, ...toClient, fromName: business.name, replyTo: business.email }));
  }
  if (allowed.has("ownerBookingConfirmation")) {
    attempts.push(sendEmail({ to: owner, ...toOwner, replyTo: client.email }));
  }
  await Promise.allSettled(attempts);
  if (attempts.length) {
    await supabase.rpc("increment_email_usage", { p_business_id: business.id, p_year_month: gate.yearMonth, p_count: attempts.length });
  }
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
  const candidates: EmailType[] = [
    ...(client.email ? (["clientCancellation"] as const) : []),
    ...(owner ? (["ownerCancellation"] as const) : []),
  ];
  const gate = await loadEmailGate(supabase, business.id);
  const allowed = allowedEmailTypes(gate, candidates);
  const attempts: Promise<unknown>[] = [];
  if (allowed.has("clientCancellation")) {
    attempts.push(
      sendEmail({
        to: client.email,
        ...clientCancelledEmail(details, false, siteLink(business, "/book", getWebUrl())),
        fromName: business.name,
        replyTo: business.email,
      })
    );
  }
  if (allowed.has("ownerCancellation")) {
    attempts.push(sendEmail({ to: owner, ...ownerClientCancelledEmail(details, `${getDashboardUrl()}/appointments`) }));
  }
  await Promise.allSettled(attempts);
  if (attempts.length) {
    await supabase.rpc("increment_email_usage", { p_business_id: business.id, p_year_month: gate.yearMonth, p_count: attempts.length });
  }

  return { ok: true };
}
