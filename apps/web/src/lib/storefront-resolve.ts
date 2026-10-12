import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { StorefrontTemplate } from "@glamsite/shared/types";
import { getStorefrontSellerBySlug } from "@/lib/live-catalog";
import { sellerSlugFromPath } from "@/lib/store-path";
import type { StorefrontSeller } from "@/lib/storefront";

/** Seller slug from the current storefront request, or undefined on demo/preview routes. */
export function requestStoreSlug(template: StorefrontTemplate): string | undefined {
  const pathname = headers().get("x-pathname") ?? "";
  return sellerSlugFromPath(pathname, template);
}

export async function requireSellerForTemplate(
  slug: string,
  template: StorefrontTemplate
): Promise<StorefrontSeller> {
  if (!slug) notFound();
  const seller = await getStorefrontSellerBySlug(slug);
  if (!seller || seller.template !== template) notFound();
  return seller;
}

/** Layout helper: 404 on unknown seller slugs; return null on demo/preview routes. */
export async function sellerForStoreLayout(
  template: StorefrontTemplate
): Promise<{ storeSlug?: string; seller: StorefrontSeller | null }> {
  const storeSlug = requestStoreSlug(template);
  if (!storeSlug) return { seller: null };
  const seller = await requireSellerForTemplate(storeSlug, template);
  return { storeSlug, seller };
}
