/**
 * Postgres rows (snake_case) → app types (camelCase).
 * Each mapper is defensive: a missing or odd column becomes a safe default.
 */
import { parseSiteContent } from "./site-content";
import { DEFAULT_TEMPLATE_ID } from "./templates";
import type {
  Appointment,
  AppointmentStatus,
  Business,
  BusinessBilling,
  BookingMode,
  BusinessStatus,
  DepositStatus,
  Enquiry,
  OpeningHours,
  Service,
  ServiceCategory,
  StaffMember,
  StaffWorkingHours,
  SubscriptionStatus,
  TimeOff,
  Weekday,
} from "./types";

type Row = Record<string, unknown>;

const str = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback);
const bool = (value: unknown, fallback = false): boolean => (typeof value === "boolean" ? value : fallback);
const int = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
const intOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
const strOrNull = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** "09:00:00" → "09:00" */
export function hhmm(value: unknown): string {
  return str(value).slice(0, 5);
}

export function businessFromRow(row: Row): Business {
  return {
    id: str(row.id),
    ownerId: str(row.owner_id),
    name: str(row.name),
    slug: str(row.slug),
    templateId: str(row.template_id, DEFAULT_TEMPLATE_ID),
    status: oneOf<BusinessStatus>(row.status, ["draft", "live", "paused"], "draft"),
    customDomain: strOrNull(row.custom_domain),
    customDomainVerified: bool(row.custom_domain_verified),
    email: str(row.email),
    phone: str(row.phone),
    address: {
      line1: str(row.address_line1),
      line2: str(row.address_line2),
      city: str(row.city),
      postcode: str(row.postcode),
      country: str(row.country, "GB"),
    },
    timezone: str(row.timezone, "Europe/London"),
    currency: str(row.currency, "GBP"),
    bookingMode: oneOf<BookingMode>(row.booking_mode, ["none", "link", "glamsite"], "none"),
    bookingUrl: str(row.booking_url),
    content: parseSiteContent(row.content),
    publishedAt: strOrNull(row.published_at),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
}

export function billingFromRow(row: Row): BusinessBilling {
  return {
    businessId: str(row.business_id),
    plan: oneOf(row.plan, ["diy", "done_for_you"] as const, "diy"),
    subscriptionStatus: oneOf<SubscriptionStatus>(
      row.subscription_status,
      ["none", "trialing", "active", "past_due", "canceled", "unpaid", "incomplete"],
      "none"
    ),
    bookingAddon: bool(row.booking_addon),
    currentPeriodEnd: strOrNull(row.current_period_end),
  };
}

export function categoryFromRow(row: Row): ServiceCategory {
  return {
    id: str(row.id),
    businessId: str(row.business_id),
    name: str(row.name),
    position: int(row.position),
  };
}

export function serviceFromRow(row: Row): Service {
  return {
    id: str(row.id),
    businessId: str(row.business_id),
    categoryId: strOrNull(row.category_id),
    name: str(row.name),
    description: str(row.description),
    durationMinutes: int(row.duration_minutes, 30),
    priceCents: intOrNull(row.price_cents),
    priceIsFrom: bool(row.price_is_from),
    bufferMinutes: int(row.buffer_minutes),
    depositCents: intOrNull(row.deposit_cents),
    isVisible: bool(row.is_visible, true),
    isBookable: bool(row.is_bookable, true),
    position: int(row.position),
    imageUrl: str(row.image_url),
  };
}

/** `staff_services` may be embedded as `staff_services: [{ service_id }]`. */
export function staffFromRow(row: Row): StaffMember {
  const links = Array.isArray(row.staff_services) ? (row.staff_services as Row[]) : [];
  return {
    id: str(row.id),
    businessId: str(row.business_id),
    name: str(row.name),
    role: str(row.role),
    bio: str(row.bio),
    photoUrl: str(row.photo_url),
    isVisible: bool(row.is_visible, true),
    isBookable: bool(row.is_bookable, true),
    position: int(row.position),
    serviceIds: links.map((link) => str(link.service_id)).filter(Boolean),
  };
}

export function openingHoursFromRow(row: Row): OpeningHours {
  return {
    id: str(row.id),
    businessId: str(row.business_id),
    weekday: Math.min(6, Math.max(0, int(row.weekday))) as Weekday,
    opensAt: hhmm(row.opens_at),
    closesAt: hhmm(row.closes_at),
  };
}

export function enquiryFromRow(row: Row): Enquiry {
  return {
    id: str(row.id),
    businessId: str(row.business_id),
    name: str(row.name),
    email: str(row.email),
    phone: str(row.phone),
    message: str(row.message),
    isRead: bool(row.is_read),
    createdAt: str(row.created_at),
  };
}

function embedded(value: unknown): Row | null {
  if (Array.isArray(value)) return (value[0] as Row) ?? null;
  return value && typeof value === "object" ? (value as Row) : null;
}

/** `clients(name, email, phone)` and `staff(name)` may be embedded. */
export function appointmentFromRow(row: Row): Appointment {
  const client = embedded(row.clients);
  const staff = embedded(row.staff);
  return {
    id: str(row.id),
    businessId: str(row.business_id),
    clientId: strOrNull(row.client_id),
    serviceId: strOrNull(row.service_id),
    staffId: strOrNull(row.staff_id),
    serviceName: str(row.service_name),
    startsAt: str(row.starts_at),
    endsAt: str(row.ends_at),
    status: oneOf<AppointmentStatus>(
      row.status,
      ["pending", "confirmed", "completed", "cancelled", "no_show"],
      "confirmed"
    ),
    priceCents: intOrNull(row.price_cents),
    currency: str(row.currency, "GBP"),
    depositCents: int(row.deposit_cents),
    depositStatus: oneOf<DepositStatus>(row.deposit_status, ["none", "pending", "paid", "refunded", "forfeited"], "none"),
    source: oneOf(row.source, ["online", "manual"] as const, "online"),
    clientNotes: str(row.client_notes),
    internalNotes: str(row.internal_notes),
    cancelledAt: strOrNull(row.cancelled_at),
    cancelledBy: row.cancelled_by === "client" || row.cancelled_by === "business" ? row.cancelled_by : null,
    createdAt: str(row.created_at),
    client: client ? { name: str(client.name), email: str(client.email), phone: str(client.phone) } : null,
    staffName: staff ? str(staff.name) : null,
  };
}

export function workingHoursFromRow(row: Row): StaffWorkingHours {
  return {
    id: str(row.id),
    businessId: str(row.business_id),
    staffId: str(row.staff_id),
    weekday: Math.min(6, Math.max(0, int(row.weekday))) as Weekday,
    startsAt: hhmm(row.starts_at),
    endsAt: hhmm(row.ends_at),
  };
}

export function timeOffFromRow(row: Row): TimeOff {
  return {
    id: str(row.id),
    businessId: str(row.business_id),
    staffId: strOrNull(row.staff_id),
    startsAt: str(row.starts_at),
    endsAt: str(row.ends_at),
    reason: str(row.reason),
  };
}
