import type { SiteContent } from "./site-content";

export type BusinessStatus = "draft" | "live" | "paused";
export type BookingMode = "none" | "link" | "glamsite";

export type Address = {
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  /** ISO 3166-1 alpha-2, e.g. GB */
  country: string;
};

export type Business = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  templateId: string;
  status: BusinessStatus;
  /** Lets the owner preview the site before it's live: /preview/{previewToken} on their site URL. */
  previewToken: string;
  customDomain: string | null;
  customDomainVerified: boolean;
  email: string;
  phone: string;
  address: Address;
  timezone: string;
  currency: string;
  /** General estimated tax rate shown on the Finance page. Informational only — never applied to a Stripe charge. Null if the owner hasn't set one. */
  taxRatePercent: number | null;
  /** Owner-authored, plain text. Null if not set. Not shown on the site by any template yet. */
  policiesText: string | null;
  /** Owner-authored, plain text. Null if not set. Not shown on the site by any template yet. */
  termsText: string | null;
  /** What a referrer earns (as a one-time discount code) once who they referred completes their first appointment. Null = referral program is off. */
  referralRewardCents: number | null;
  bookingMode: BookingMode;
  bookingUrl: string;
  content: SiteContent;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

export type HostingTier = "basic" | "popular" | "premium";

export type BusinessBilling = {
  businessId: string;
  designService: "diy" | "done_for_you";
  hostingTier: HostingTier;
  subscriptionStatus: SubscriptionStatus;
  bookingAddon: boolean;
  stripeBookingAddonItemId: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeConnectAccountId: string | null;
  stripeConnectChargesEnabled: boolean;
};

/** One member per Resend template in `email.ts`; a future "reminder" slots in the same way. */
export type EmailType =
  | "clientBookingConfirmation"
  | "ownerBookingConfirmation"
  | "clientCancellation"
  | "ownerCancellation";

export type EmailNotificationSettings = {
  businessId: string;
  clientBookingConfirmationEnabled: boolean;
  ownerBookingConfirmationEnabled: boolean;
  clientCancellationEnabled: boolean;
  ownerCancellationEnabled: boolean;
};

/** One row per business per calendar month ("2026-11"); rolls over for free. */
export type EmailUsage = {
  businessId: string;
  yearMonth: string;
  sentCount: number;
};

export type TemplatePriceTier = "single_page" | "regular" | "luxe";

export type Template = {
  id: string;
  name: string;
  priceCents: number | null;
  priceTier: TemplatePriceTier | null;
  isActive: boolean;
  position: number;
};

export type ServiceCategory = {
  id: string;
  businessId: string;
  name: string;
  position: number;
};

export type Service = {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  description: string;
  durationMinutes: number;
  /** null = "price on consultation" */
  priceCents: number | null;
  priceIsFrom: boolean;
  bufferMinutes: number;
  depositCents: number | null;
  isVisible: boolean;
  isBookable: boolean;
  position: number;
  imageUrl: string;
};

export type StaffMember = {
  id: string;
  businessId: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  isVisible: boolean;
  isBookable: boolean;
  position: number;
  /** Services this person does (from staff_services). */
  serviceIds: string[];
};

/** 0 = Monday … 6 = Sunday */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type OpeningHours = {
  id: string;
  businessId: string;
  weekday: Weekday;
  /** "HH:MM", local to the business's timezone */
  opensAt: string;
  closesAt: string;
};

/** A person who's booked, or been added manually. Matched by email per business. */
export type Client = {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  /** Owner-only, never shown to the client. */
  notes: string;
  /** This client's own code for referring friends. Always set. */
  referralCode: string;
  createdAt: string;
  updatedAt: string;
};

export type ReferralStatus = "pending" | "rewarded";

/** One referred client, tracked once from their first booking to their first completed appointment. */
export type ClientReferral = {
  id: string;
  businessId: string;
  referrerClientId: string;
  referredClientId: string;
  status: ReferralStatus;
  rewardDiscountCodeId: string | null;
  createdAt: string;
  rewardedAt: string | null;
  /** Embedded when the query selects `referrer:referrer_client_id(name, email)`. */
  referrerName: string | null;
  referrerEmail: string | null;
  /** Embedded when the query selects `referred:referred_client_id(name, email)`. */
  referredName: string | null;
  referredEmail: string | null;
};

export type PlatformReferralStatus = "submitted" | "contacted" | "signed_up" | "active" | "lost";

/** A business-to-business referral: one business owner refers another to the platform ("Earn"). */
export type PlatformReferral = {
  id: string;
  referrerBusinessId: string;
  referredBusinessName: string;
  referredContactName: string;
  referredContactEmail: string;
  referredContactPhone: string;
  status: PlatformReferralStatus;
  /** Set by staff once the referred business actually signs up. */
  referredBusinessId: string | null;
  /** Staff-only context; never shown to the referrer. */
  staffNotes: string;
  createdAt: string;
  updatedAt: string;
};

/** One calendar month's commission on a referral, recorded by staff from the referred business's real hosting spend. */
export type PlatformReferralEarning = {
  id: string;
  referralId: string;
  referrerBusinessId: string;
  /** "2026-11" */
  yearMonth: string;
  grossCents: number;
  commissionCents: number;
  createdAt: string;
};

/** How a referrer wants their commission paid. Covers the UK (bank_uk), US (zelle, cashapp, paypal), Canada (interac) and Europe (iban). */
export type PlatformReferralPayoutMethod = "bank_uk" | "iban" | "zelle" | "cashapp" | "paypal" | "interac";

/**
 * Where staff send a referrer's commission. Plain payout details, not
 * Stripe -- this is platform revenue share, not a salon's own booking
 * payment. `identifier`/`identifier2` hold whatever that method needs (see
 * PLATFORM_REFERRAL_PAYOUT_METHOD_FIELDS); identifier2 is blank except for
 * bank_uk (sort code) and iban (BIC/SWIFT).
 */
export type PlatformReferralPayoutDetails = {
  businessId: string;
  method: PlatformReferralPayoutMethod;
  accountName: string;
  identifier: string;
  identifier2: string;
  notes: string;
  updatedAt: string;
};

export type Enquiry = {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type OwnerUser = {
  id: string;
  email: string | null;
};

/** Everything a template needs to render one site. */
export type SiteData = {
  business: Business;
  categories: ServiceCategory[];
  services: Service[];
  staff: StaffMember[];
  hours: OpeningHours[];
};

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "late";
export type DepositStatus = "none" | "pending" | "paid" | "refunded" | "forfeited";

export type Appointment = {
  id: string;
  businessId: string;
  clientId: string | null;
  serviceId: string | null;
  staffId: string | null;
  /** Snapshot of the service name when it was booked. */
  serviceName: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  /** When an owner checked this client in on arrival. Independent of status. */
  checkedInAt: string | null;
  /** Set if whoever booked this appointment was referred by another client, for the referral program. */
  referredByClientId: string | null;
  priceCents: number | null;
  currency: string;
  depositCents: number;
  depositStatus: DepositStatus;
  source: "online" | "manual";
  clientNotes: string;
  internalNotes: string;
  cancelledAt: string | null;
  cancelledBy: "client" | "business" | null;
  createdAt: string;
  /** The code the client entered, if any. Null means no discount was applied. */
  discountCode: string | null;
  /** How much was taken off because of discountCode. 0 when discountCode is null. */
  discountCents: number;
  /** What was actually given back to the client. Recorded by the owner, not fetched from Stripe. 0 means no refund. */
  refundCents: number;
  refundedAt: string | null;
  /** Embedded when the query selects `clients(name, email, phone)`. */
  client: { name: string; email: string; phone: string } | null;
  /** Embedded when the query selects `staff(name)`. */
  staffName: string | null;
};

export type DiscountKind = "percent" | "fixed";

/** A promo code an owner creates; a client enters it at checkout. */
export type DiscountCode = {
  id: string;
  businessId: string;
  code: string;
  kind: DiscountKind;
  /** Set when kind is "percent", 1-100. Null when kind is "fixed". */
  percentOff: number | null;
  /** Set when kind is "fixed". Null when kind is "percent". */
  amountOffCents: number | null;
  isActive: boolean;
  /** null = unlimited. */
  maxRedemptions: number | null;
  redemptionCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** One stretch of a team member's weekly working time ("HH:MM", local). */
export type StaffWorkingHours = {
  id: string;
  businessId: string;
  staffId: string;
  weekday: Weekday;
  startsAt: string;
  endsAt: string;
};

/** Holiday, sickness or a closure. `staffId: null` closes the whole business. */
export type TimeOff = {
  id: string;
  businessId: string;
  staffId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string;
};
