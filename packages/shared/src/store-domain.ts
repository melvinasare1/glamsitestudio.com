/** Apex host for Glam Site Studios marketing (apps/web landing pages). */
export const STOREFRONT_ROOT_DOMAIN = "glamsitestudio.com";

/**
 * Subdomains that must never be claimed as a seller store_slug.
 * Keep in sync with sellers_store_slug_not_reserved in supabase migrations.
 */
export const RESERVED_STORE_SUBDOMAINS = [
  "www",
  "api",
  "dashboard",
  "app",
  "admin",
  "mail",
  "status",
  "cdn",
  "auth",
  "login",
  "signup",
  "staging",
  "preview",
] as const;

const RESERVED_STORE_SUBDOMAIN_SET = new Set<string>(RESERVED_STORE_SUBDOMAINS);

export function isReservedStoreSubdomain(value: string): boolean {
  return RESERVED_STORE_SUBDOMAIN_SET.has(value.trim().toLowerCase());
}

/** Normalize a Host header or sellers.domain value (no port, lowercase). */
export function normalizeStoreHost(value: string): string {
  return value.split(":")[0]?.trim().toLowerCase().replace(/\.$/, "") ?? "";
}

export function isMarketingApexHost(hostname: string): boolean {
  const host = normalizeStoreHost(hostname);
  return host === STOREFRONT_ROOT_DOMAIN || host === `www.${STOREFRONT_ROOT_DOMAIN}`;
}

/**
 * Hosts that belong to the Glam Site Studios apps themselves (marketing, local dev,
 * Vercel previews) — not a seller storefront. Exact seller-domain lookup
 * must not run on these.
 */
export function isPlatformPassThroughHost(hostname: string): boolean {
  const host = normalizeStoreHost(hostname);
  if (!host) return true;
  if (isMarketingApexHost(host)) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host.endsWith(".vercel.app")) return true;
  return false;
}

/**
 * Exact connected host stored on the seller, or null when none is connected.
 * Empty strings and marketing apex values are treated as not connected.
 */
export function connectedStoreHost(domain: string | null | undefined): string | null {
  const host = normalizeStoreHost(domain ?? "");
  if (!host || isMarketingApexHost(host)) return null;
  return host;
}

/** Internal App Router path. Buyers should not see this. */
export function storefrontInternalPath(template: string, storeSlug: string): string {
  return `/store/${template}/${storeSlug}`;
}

/** Public storefront path on the marketing host: /store/{slug}. */
export function storefrontPublicPath(storeSlug: string): string {
  return `/store/${storeSlug}`;
}

/** Host buyers use once an Glam Site Studios temp subdomain is actually connected. */
export function storefrontHost(storeSlug: string): string {
  return `${storeSlug}.${STOREFRONT_ROOT_DOMAIN}`;
}

/** Public HTTPS URL for an exact connected host. */
export function publicStorefrontUrlFromHost(host: string): string {
  return `https://${normalizeStoreHost(host)}`;
}

export const SELLER_DOMAIN_TYPES = ["subdomain", "custom"] as const;

export type SellerDomainType = (typeof SELLER_DOMAIN_TYPES)[number];

export function parseSellerDomainType(value: unknown): SellerDomainType {
  return value === "custom" ? "custom" : "subdomain";
}
