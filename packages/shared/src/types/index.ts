// Postgres data model (see supabase/migrations/). TypeScript stays camelCase;
// snake_case columns are mapped at the query layer in mappers.ts.
// Everything tenant-scoped is keyed by sellerId (= sellers.id). Once Auth is
// wired, create seller rows with id = auth.uid().

import type { SellerDomainType } from "../store-domain";

export const PRICING_TIERS = ["website_admin", "fulfilment"] as const;

export type PricingTier = (typeof PRICING_TIERS)[number];

export function parsePricingTier(value: unknown): PricingTier {
  return value === "fulfilment" ? "fulfilment" : "website_admin";
}

export const PRICING_TIER_BASE_FEE_CEDIS: Record<PricingTier, number> = {
  website_admin: 250,
  fulfilment: 400,
};

export const SELLER_STATUSES = ["onboarding", "active", "paused", "offboarded"] as const;

export type SellerStatus = (typeof SELLER_STATUSES)[number];

export function parseSellerStatus(value: unknown): SellerStatus {
  return SELLER_STATUSES.includes(value as SellerStatus)
    ? (value as SellerStatus)
    : "onboarding";
}

/** Billing only — separate from storefront `status` (onboarding/active/paused/offboarded). */
export const SUBSCRIPTION_STATUSES = ["trialing", "active", "overdue"] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export function parseSubscriptionStatus(value: unknown): SubscriptionStatus {
  return SUBSCRIPTION_STATUSES.includes(value as SubscriptionStatus)
    ? (value as SubscriptionStatus)
    : "trialing";
}

export {
  parseSellerDomainType,
  SELLER_DOMAIN_TYPES,
  type SellerDomainType,
} from "../store-domain";

export type SellerUser = {
  uid: string;
  email: string | null;
};

export const STOREFRONT_TEMPLATES = [
  "template-a",
  "sneaker-template",
  "kitchenware-template",
  "motorbike-template",
  "imports-template",
  "hair-beauty-template",
] as const;

export type StorefrontTemplate = (typeof STOREFRONT_TEMPLATES)[number];

export function parseStorefrontTemplate(value: unknown): StorefrontTemplate {
  return STOREFRONT_TEMPLATES.includes(value as StorefrontTemplate)
    ? (value as StorefrontTemplate)
    : "template-a";
}

export type StoreFaq = {
  question: string;
  answer: string;
};

export interface Seller {
  id: string;
  uid: string; // Intended auth uid of the seller who owns this tenant
  businessName: string;
  /** Exact connected host (custom or a provisioned glamsitestudio.com subdomain). Null until connected. */
  domain: string | null;
  /** How `domain` is provisioned when set. Unused while domain is null. */
  domainType: SellerDomainType;
  /** True once the stored host is actually pointed at apps/web. */
  domainVerified: boolean;
  storeSlug: string;
  template: StorefrontTemplate;
  email: string;
  /** Contact mobile number. */
  phone: string;
  /** Mobile Money number buyers pay at checkout. Falls back to phone when unset. */
  momoPhone: string;
  pricingTier: PricingTier;
  baseFeeCedis: number; // 250 Website & Admin, 400 Fulfilment intro
  status: SellerStatus;
  createdAt: number;
  /** Epoch ms when the 30-day free trial ends. Unset for accounts that skip onboarding. */
  trialEndsAt?: number;
  /**
   * Billing state. Independent of storefront `status`.
   * trialing while trial runs; overdue after trial with no confirmed payment; active once paid.
   */
  subscriptionStatus: SubscriptionStatus;
  /** Epoch ms when an admin last confirmed a MoMo subscription payment. */
  lastPaymentConfirmedAt?: number;
  /** Permanent 6-digit MoMo payment reference. Assigned on insert, never regenerated. */
  billingReference?: string;
  /** Private storage object path in the id-verification bucket, not a public URL. */
  idDocumentUrl?: string;
  profilePhotoUrl?: string;
  businessRegistrationUrl?: string;
  hasBusinessRegistration: boolean;
  /** Seller-written return policy shown on Verify. Empty until they save one. */
  returnPolicy: string;
  /** Epoch ms when the seller clicked Publish. Status stays onboarding until manual review. */
  verificationSubmittedAt?: number;
  /** Editable storefront copy, image URLs, and repeatable lists, keyed by template field keys. */
  storeContent: Record<string, string | Array<Record<string, string>>>;
  /** Store-wide FAQs reused on every product page. */
  faqs: StoreFaq[];
}

/** Templates that show a blog on the storefront and a Blog nav in the dashboard. */
export const STOREFRONT_TEMPLATES_WITH_BLOG = ["motorbike-template"] as const;

export function templateHasBlog(template: StorefrontTemplate | undefined): boolean {
  return Boolean(
    template &&
      (STOREFRONT_TEMPLATES_WITH_BLOG as readonly string[]).includes(template)
  );
}

export interface StoreBlogPost {
  id: string;
  sellerId: string;
  title: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  published: boolean;
  publishedAt: number;
  createdAt: number;
  updatedAt: number;
}

export type ProductCondition = "new" | "used";

export type ProductVariant = {
  id: string;
  name?: string;
  values?: string[];
  size?: string;
  color?: string;
  sku: string;
  priceCedis: number;
  stockQuantity: number;
  images: string[];
  imagesByValue?: Record<string, string[]>;
};

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  shortDescription?: string;
  priceCedis: number;
  compareAtPriceCedis?: number;
  images: string[];
  stockQuantity: number;
  sku: string;
  category: string;
  active: boolean;
  createdAt: number;
  // Optional variant options the seller sets on the product. Buyer selections
  // live on the cart item, not on this row.
  sizes?: string[];
  colors?: string[];
  /** Named options the seller adds (e.g. Color with values Black, White). */
  variants?: ProductVariant[];
  /** Short strings shown as a tick-list on the product page. */
  features?: string[];
  /** Ride / listing filters. */
  tags?: string[];
  engineSize?: string;
  condition?: ProductCondition;
  year?: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  sellerId: string;
  orderId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "packed"
  | "dispatched"
  | "delivered"
  | "return_requested"
  | "returned"
  | "cancelled"
  | "refunded";

export interface Customer {
  id: string;
  sellerId: string;
  email: string;
  name: string;
  phone: string;
  deliveryAddress: string;
  createdAt: number;
  updatedAt: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  priceCedis: number;
  quantity: number;
  size?: string;
  color?: string;
  /** Buyer selections for multi-axis variants (axis name → value). */
  selectedVariants?: Record<string, string>;
}

export interface Order {
  id: string;
  sellerId: string;
  customerId?: string;
  items: OrderItem[];
  subtotalCedis: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  deliveryAddress: string;
  status: OrderStatus;
  paymentReference?: string;
  packagingPhotoUrl?: string;
  packagingVideoUrl?: string;
  riderService?: "yango" | "in_house";
  createdAt: number;
  packedAt?: number;
  dispatchedAt?: number;
}

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  sellerId: string;
  impressions: number;
  storeVisits: number;
  ordersPlaced: number;
  revenueCedis: number;
}

export type StorefrontEventType = "page_view" | "product_view" | "add_to_cart";

export interface StorefrontEvent {
  id: string;
  sellerId: string;
  eventType: StorefrontEventType;
  path: string;
  productId?: string;
  sessionId: string;
  createdAt: number;
}

// Signup lead from the landing page — not yet a seller until onboarded/inspected
export interface SignupLead {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  productCategory: string;
  estimatedMonthlyOrders?: number;
  notes?: string;
  createdAt: number;
}
