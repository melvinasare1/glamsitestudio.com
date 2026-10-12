import {
  connectedStoreHost,
  publicStorefrontUrlFromHost,
  storefrontPublicPath,
} from "@glamsite/shared/store-domain";
import { getWebUrl } from "@glamsite/shared/supabase/env";
import type { Seller } from "@glamsite/shared/types";

export function hasConnectedStoreDomain(seller: Seller | null): boolean {
  return Boolean(connectedStoreHost(seller?.domain));
}

/** Public path storefront: /store/{slug}. */
export function storefrontPathUrl(seller: Seller | null): string | null {
  if (!seller?.storeSlug) return null;
  return `${getWebUrl()}${storefrontPublicPath(seller.storeSlug)}`;
}

/** Live connected host when set; otherwise the preview storefront URL. */
export function storefrontUrl(seller: Seller | null): string | null {
  const host = connectedStoreHost(seller?.domain);
  if (host) return publicStorefrontUrlFromHost(host);
  return storefrontPathUrl(seller);
}

/**
 * Namecheap affiliate URL for the Settings Domain CTA.
 * Empty or invalid values hide the button — never link to a broken href.
 */
export function namecheapAffiliateUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_NAMECHEAP_AFFILIATE_URL?.trim() ?? "";
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}
