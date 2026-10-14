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
  customDomain: string | null;
  customDomainVerified: boolean;
  email: string;
  phone: string;
  address: Address;
  timezone: string;
  currency: string;
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

export type BusinessBilling = {
  businessId: string;
  plan: "diy" | "done_for_you";
  subscriptionStatus: SubscriptionStatus;
  bookingAddon: boolean;
  currentPeriodEnd: string | null;
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
