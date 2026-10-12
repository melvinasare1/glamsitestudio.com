import { storefrontPublicPath } from "@glamsite/shared/store-domain";
import { STOREFRONT_TEMPLATES, type StorefrontTemplate } from "@glamsite/shared/types";

/** Static first segments under `/store/{template}/` that are never a seller slug. */
export const STORE_RESERVED_SEGMENTS = new Set([
  "search",
  "blog",
  "product",
  "cart",
  "contact",
]);

const TEMPLATE_SEGMENTS = new Set<string>(STOREFRONT_TEMPLATES);

export function storefrontBase(template: StorefrontTemplate, storeSlug?: string): string {
  return storeSlug ? storefrontPublicPath(storeSlug) : `/store/${template}`;
}

/** Seller `store_slug` from a storefront pathname, or undefined on demo/preview routes. */
export function sellerSlugFromPath(pathname: string, template: StorefrontTemplate): string | undefined {
  const prefix = `/store/${template}`;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    const segment = pathname.slice(prefix.length).replace(/^\//, "").split("/")[0] ?? "";
    if (!segment || STORE_RESERVED_SEGMENTS.has(segment)) return undefined;
    return segment;
  }

  if (!pathname.startsWith("/store/")) return undefined;
  const segment = pathname.slice("/store/".length).split("/")[0] ?? "";
  if (!segment || STORE_RESERVED_SEGMENTS.has(segment) || TEMPLATE_SEGMENTS.has(segment)) {
    return undefined;
  }
  return segment;
}

/** Prefer the slug in the URL (public or internal). Fall back to the route param. */
export function sellerSlugFromLocation(
  pathname: string,
  template: StorefrontTemplate,
  paramSlug?: string
): string {
  return sellerSlugFromPath(pathname, template) || paramSlug || "";
}

/** Store home for the current path, including public `/store/{slug}` URLs. */
export function storeHomeHref(pathname: string): string {
  for (const template of STOREFRONT_TEMPLATES) {
    const slug = sellerSlugFromPath(pathname, template);
    if (slug) return storefrontPublicPath(slug);
  }
  const segment = pathname.startsWith("/store/")
    ? pathname.slice("/store/".length).split("/")[0] ?? ""
    : "";
  if (segment && TEMPLATE_SEGMENTS.has(segment)) return `/store/${segment}`;
  if (segment && !STORE_RESERVED_SEGMENTS.has(segment)) return storefrontPublicPath(segment);
  return "/";
}
