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
  Client,
  ClientReferral,
  DepositEvent,
  DepositStatus,
  DiscountCode,
  DiscountKind,
  EmailNotificationSettings,
  EmailUsage,
  Enquiry,
  HostingTier,
  OpeningHours,
  PlatformReferral,
  PlatformReferralEarning,
  PlatformReferralPayoutDetails,
  PlatformReferralStatus,
  ReferralStatus,
  Service,
  ServiceCategory,
  StaffMember,
  StaffWorkingHours,
  SubscriptionStatus,
  Template,
  TemplatePriceTier,
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
/** `numeric` columns come back from PostgREST as strings (to avoid float precision loss), so parse rather than type-check. */
const floatOrNull = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
};

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
    previewToken: str(row.preview_token),
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
    taxRatePercent: floatOrNull(row.tax_rate_percent),
    policiesText: strOrNull(row.policies_text),
    termsText: strOrNull(row.terms_text),
    referralRewardCents: intOrNull(row.referral_reward_cents),
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
    designService: oneOf(row.design_service, ["diy", "done_for_you"] as const, "diy"),
    hostingTier: oneOf<HostingTier>(row.hosting_tier, ["basic", "popular", "premium"], "basic"),
    subscriptionStatus: oneOf<SubscriptionStatus>(
      row.subscription_status,
      ["none", "trialing", "active", "past_due", "canceled", "unpaid", "incomplete"],
      "none"
    ),
    bookingAddon: bool(row.booking_addon),
    stripeBookingAddonItemId: strOrNull(row.stripe_booking_addon_item_id),
    currentPeriodEnd: strOrNull(row.current_period_end),
    stripeCustomerId: strOrNull(row.stripe_customer_id),
    stripeSubscriptionId: strOrNull(row.stripe_subscription_id),
    stripeConnectAccountId: strOrNull(row.stripe_connect_account_id),
    stripeConnectChargesEnabled: bool(row.stripe_connect_charges_enabled),
  };
}

export function emailNotificationSettingsFromRow(row: Row): EmailNotificationSettings {
  return {
    businessId: str(row.business_id),
    clientBookingConfirmationEnabled: bool(row.client_booking_confirmation_enabled, true),
    ownerBookingConfirmationEnabled: bool(row.owner_booking_confirmation_enabled, true),
    clientCancellationEnabled: bool(row.client_cancellation_enabled, true),
    ownerCancellationEnabled: bool(row.owner_cancellation_enabled, true),
  };
}

export function emailUsageFromRow(row: Row): EmailUsage {
  return {
    businessId: str(row.business_id),
    yearMonth: str(row.year_month),
    sentCount: int(row.sent_count),
  };
}

export function templateFromRow(row: Row): Template {
  return {
    id: str(row.id),
    name: str(row.name),
    priceCents: intOrNull(row.price_cents),
    priceTier: row.price_tier === "single_page" || row.price_tier === "regular" || row.price_tier === "luxe"
      ? (row.price_tier as TemplatePriceTier)
      : null,
    isActive: bool(row.is_active, true),
    position: int(row.position),
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

export function clientFromRow(row: Row): Client {
  return {
    id: str(row.id),
    businessId: str(row.business_id),
    name: str(row.name),
    email: str(row.email),
    phone: str(row.phone),
    notes: str(row.notes),
    referralCode: str(row.referral_code),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
}

/** `referrer:referrer_client_id(name, email)` and `referred:referred_client_id(name, email)` may be embedded. */
export function clientReferralFromRow(row: Row): ClientReferral {
  const referrer = embedded(row.referrer);
  const referred = embedded(row.referred);
  return {
    id: str(row.id),
    businessId: str(row.business_id),
    referrerClientId: str(row.referrer_client_id),
    referredClientId: str(row.referred_client_id),
    status: oneOf<ReferralStatus>(row.status, ["pending", "rewarded"], "pending"),
    rewardDiscountCodeId: strOrNull(row.reward_discount_code_id),
    createdAt: str(row.created_at),
    rewardedAt: strOrNull(row.rewarded_at),
    referrerName: referrer ? str(referrer.name) : null,
    referrerEmail: referrer ? str(referrer.email) : null,
    referredName: referred ? str(referred.name) : null,
    referredEmail: referred ? str(referred.email) : null,
  };
}

export function platformReferralFromRow(row: Row): PlatformReferral {
  return {
    id: str(row.id),
    referrerBusinessId: str(row.referrer_business_id),
    referredBusinessName: str(row.referred_business_name),
    referredContactName: str(row.referred_contact_name),
    referredContactEmail: str(row.referred_contact_email),
    referredContactPhone: str(row.referred_contact_phone),
    status: oneOf<PlatformReferralStatus>(
      row.status,
      ["submitted", "contacted", "signed_up", "active", "lost"],
      "submitted"
    ),
    referredBusinessId: strOrNull(row.referred_business_id),
    staffNotes: str(row.staff_notes),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
}

export function platformReferralEarningFromRow(row: Row): PlatformReferralEarning {
  return {
    id: str(row.id),
    referralId: str(row.referral_id),
    referrerBusinessId: str(row.referrer_business_id),
    yearMonth: str(row.year_month),
    grossCents: int(row.gross_cents),
    commissionCents: int(row.commission_cents),
    createdAt: str(row.created_at),
  };
}

export function platformReferralPayoutDetailsFromRow(row: Row): PlatformReferralPayoutDetails {
  return {
    businessId: str(row.business_id),
    method: str(row.method) as PlatformReferralPayoutDetails["method"],
    accountName: str(row.account_name),
    identifier: str(row.identifier),
    identifier2: str(row.identifier_2),
    notes: str(row.notes),
    updatedAt: str(row.updated_at),
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

/** For a to-many embed, e.g. `appointment_deposit_events(...)`. */
function embeddedArray(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}

function depositEventFromRow(row: Row): DepositEvent {
  return {
    id: str(row.id),
    kind: row.kind === "forfeited" ? "forfeited" : "refunded",
    amountCents: int(row.amount_cents),
    createdAt: str(row.created_at),
  };
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
      ["pending", "confirmed", "completed", "cancelled", "no_show", "late"],
      "confirmed"
    ),
    checkedInAt: strOrNull(row.checked_in_at),
    referredByClientId: strOrNull(row.referred_by_client_id),
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
    discountCode: strOrNull(row.discount_code),
    discountCents: int(row.discount_cents),
    refundCents: int(row.refund_cents),
    refundedAt: strOrNull(row.refunded_at),
    depositEvents: embeddedArray(row.appointment_deposit_events).map(depositEventFromRow),
    client: client ? { name: str(client.name), email: str(client.email), phone: str(client.phone) } : null,
    staffName: staff ? str(staff.name) : null,
  };
}

export function discountCodeFromRow(row: Row): DiscountCode {
  return {
    id: str(row.id),
    businessId: str(row.business_id),
    code: str(row.code),
    kind: oneOf<DiscountKind>(row.kind, ["percent", "fixed"], "percent"),
    percentOff: intOrNull(row.percent_off),
    amountOffCents: intOrNull(row.amount_off_cents),
    isActive: bool(row.is_active, true),
    maxRedemptions: intOrNull(row.max_redemptions),
    redemptionCount: int(row.redemption_count),
    expiresAt: strOrNull(row.expires_at),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
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
