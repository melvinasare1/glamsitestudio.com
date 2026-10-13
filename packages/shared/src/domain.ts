/**
 * Hostnames. Every site gets `{slug}.glamsitestudio.com`; owners can also
 * connect their own domain (businesses.custom_domain).
 */

export const PLATFORM_DOMAIN = "glamsitestudio.com";

/** Subdomains that can never be a business slug. Keep in sync with the businesses.slug check. */
export const RESERVED_SLUGS = [
  "www",
  "api",
  "app",
  "admin",
  "dashboard",
  "mail",
  "status",
  "cdn",
  "auth",
  "login",
  "signup",
  "staging",
  "preview",
  "demo",
  "help",
  "support",
  "blog",
] as const;

const RESERVED = new Set<string>(RESERVED_SLUGS);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isReservedSlug(value: string): boolean {
  return RESERVED.has(value.trim().toLowerCase());
}

/** "Bella's Hair & Beauty" → "bellas-hair-beauty" */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/g, "");
}

/** An error message, or null when the slug can be used. */
export function slugProblem(slug: string): string | null {
  if (slug.length < 2) return "Use at least 2 letters or numbers.";
  if (slug.length > 63) return "Keep it under 63 characters.";
  if (!SLUG_PATTERN.test(slug)) return "Use lowercase letters, numbers and single dashes.";
  if (isReservedSlug(slug)) return "That address is reserved. Try another.";
  return null;
}

/** Lowercase host without port or trailing dot. */
export function normalizeHost(value: string): string {
  return (value.split(":")[0] ?? "").trim().toLowerCase().replace(/\.$/, "");
}

export function isPlatformApex(host: string): boolean {
  const value = normalizeHost(host);
  return value === PLATFORM_DOMAIN || value === `www.${PLATFORM_DOMAIN}`;
}

/** Hosts that belong to our own apps (marketing, local dev, Vercel previews). */
export function isAppHost(host: string): boolean {
  const value = normalizeHost(host);
  if (!value) return true;
  if (isPlatformApex(value)) return true;
  if (value === `dashboard.${PLATFORM_DOMAIN}`) return true;
  if (value === "localhost" || value === "127.0.0.1") return true;
  return value.endsWith(".vercel.app");
}

/** `bella.glamsitestudio.com` → `bella`; anything else → null. */
export function slugFromPlatformHost(host: string): string | null {
  const value = normalizeHost(host);
  const suffix = `.${PLATFORM_DOMAIN}`;
  if (!value.endsWith(suffix)) return null;
  const slug = value.slice(0, -suffix.length);
  if (!slug || slug.includes(".") || isReservedSlug(slug) || !SLUG_PATTERN.test(slug)) return null;
  return slug;
}

export function platformHostForSlug(slug: string): string {
  return `${slug}.${PLATFORM_DOMAIN}`;
}

/** The address a live site is reached at: its verified custom domain, else its subdomain. */
export function siteUrl(business: {
  slug: string;
  customDomain: string | null;
  customDomainVerified: boolean;
}): string {
  if (business.customDomain && business.customDomainVerified) {
    return `https://${normalizeHost(business.customDomain)}`;
  }
  return `https://${platformHostForSlug(business.slug)}`;
}
