import {
  filledStorefrontContentItems,
  storefrontContentValue,
  type StorefrontContent,
  type StorefrontRepeatableItem,
} from "@glamsite/shared/storefront-content-schema";

const IMAGES = {
  hero: "/store/motorbike-template/hero.png",
  motorbike: "/store/motorbike-template/motorbike.png",
  moped: "/store/motorbike-template/moped.png",
  classic: "/store/motorbike-template/classic.png",
  ebike: "/store/motorbike-template/ebike.png",
} as const;

export const RIDE_CONTENT_FALLBACKS = {
  logoUrl: "",
  heroHeadline: "Ride Better.\nRide Together.",
  heroSubtext:
    "Motorbikes, bicycles, mopeds, and scooters, chosen for the ride and backed by people who know the machines.",
  heroImage: IMAGES.hero,
  shopHeading: "Shop",
  promoHeadline: "Apex R9",
  promoKicker: "Street Motorbike",
  promoBody:
    "Street-ready motorbike with a punchy engine, upright seating, and the range to cover town and the open road.",
  promoImage: IMAGES.motorbike,
  accessoriesHeading: "Gear & Accessories",
  darkBannerHeadline: "E-Bike",
  darkBannerBody:
    "Quiet power for city hops and weekend loops. A removable battery, disc brakes, and a ride that stays composed in traffic.",
  darkBannerImage: IMAGES.ebike,
  darkBannerCalloutTitle: "Super Powerful Battery",
  darkBannerCalloutBody: "The best range ever seen for a bike like this.",
  blogHeading: "Recent Blog Posts",
  footerTagline:
    "Motorbikes, bicycles, mopeds, and scooters, sold, fitted, and serviced by people who ride.",
  footerNewsletterHeading: "Signup for latest information",
  contactKicker: "Get in touch",
  contactHeadline: "Contact Us",
  contactSubtext: "Send a message, ping us on WhatsApp, or call {brandName} directly.",
  contactFormHeading: "Send a message",
  contactFormIntro: "Tell us what you're looking for and we'll come back to you.",
  contactWhatsappHeading: "Call or WhatsApp",
  contactWhatsappBody: "Prefer to talk? Reach {brandName} on WhatsApp at the number below.",
} as const;

export const RIDE_TRUST_BADGE_FALLBACKS: StorefrontRepeatableItem[] = [
  { label: "Affordable Prices" },
  { label: "Knowledgeable Staff" },
  { label: "Warranty" },
  { label: "Installment plans" },
];

export const RIDE_SHOP_CATEGORY_FALLBACKS: StorefrontRepeatableItem[] = [
  { label: "Motorbikes", image: IMAGES.motorbike, linkCategory: "motorbikes" },
  { label: "Bicycles", image: IMAGES.ebike, linkCategory: "bicycles" },
  { label: "Mopeds", image: IMAGES.moped, linkCategory: "mopeds" },
  { label: "Scooters", image: IMAGES.classic, linkCategory: "scooters" },
];

export const RIDE_FEATURE_STRIP_FALLBACKS: StorefrontRepeatableItem[] = [
  {
    label: "Trusted Brands",
    body: "Machines and parts from names riders already know, stocked because they last.",
  },
  {
    label: "Certified Repair Specialists",
    body: "Workshop techs trained on motorbikes, mopeds, scooters, and bicycles.",
  },
  {
    label: "Community Support",
    body: "Fit advice, group rides, and a shop floor that talks riding, not just SKUs.",
  },
  {
    label: "Tailored Service",
    body: "Setup, servicing, and gear recommendations sized to how you actually ride.",
  },
];

export const RIDE_VALUE_PROP_FALLBACKS: StorefrontRepeatableItem[] = [
  {
    label: "Special Offers",
    body: "Seasonal drops, bundle pricing, and trade-in credit on machines you already ride.",
  },
  {
    label: "Instalment Plans",
    body: "Pay a deposit and spread the rest over 2-3 months. Get in touch to arrange terms.",
  },
  {
    label: "Delivery Across Accra",
    body: "We arrange delivery anywhere in Accra once payment is confirmed.",
  },
];

export const RIDE_SOCIAL_LINK_FALLBACKS: StorefrontRepeatableItem[] = [
  { network: "Facebook", url: "#" },
  { network: "Instagram", url: "#" },
  { network: "Twitter", url: "#" },
  { network: "LinkedIn", url: "#" },
];

export function rideText(
  content: StorefrontContent | undefined,
  key: keyof typeof RIDE_CONTENT_FALLBACKS
): string {
  return storefrontContentValue(content, key, RIDE_CONTENT_FALLBACKS[key]);
}

function mergeItem(
  item: StorefrontRepeatableItem,
  fallback: StorefrontRepeatableItem | undefined
): StorefrontRepeatableItem {
  const keys = new Set([...Object.keys(fallback ?? {}), ...Object.keys(item)]);
  const out: StorefrontRepeatableItem = {};
  for (const key of keys) {
    out[key] = item[key]?.trim() || fallback?.[key] || "";
  }
  return out;
}

export function rideList(
  content: StorefrontContent | undefined,
  key: string,
  fallbacks: StorefrontRepeatableItem[]
): StorefrontRepeatableItem[] {
  const filled = filledStorefrontContentItems(content, key);
  if (!filled.length) return fallbacks;
  return filled.map((item, index) => mergeItem(item, fallbacks[index]));
}

export function rideOptionalList(
  content: StorefrontContent | undefined,
  key: string
): StorefrontRepeatableItem[] {
  return filledStorefrontContentItems(content, key);
}

export function interpolateBrand(text: string, brandName: string): string {
  return text.replaceAll("{brandName}", brandName).replaceAll("{store}", brandName);
}
