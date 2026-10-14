/**
 * Postgres rows (snake_case) → app types (camelCase).
 * Each mapper is defensive: a missing or odd column becomes a safe default.
 */
import { parseSiteContent } from "./site-content";
import { DEFAULT_TEMPLATE_ID } from "./templates";
import type {
  Business,
  BusinessBilling,
  BookingMode,
  BusinessStatus,
  Enquiry,
  OpeningHours,
  Service,
  ServiceCategory,
  StaffMember,
  SubscriptionStatus,
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
