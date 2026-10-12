import { createClient } from "@glamsite/shared/supabase/server";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";
import type { Product, StoreBlogPost, StoreFaq } from "@glamsite/shared/types";
import {
  getActiveProductsForSeller,
  getPublishedBlogPosts,
  getSellerByStoreSlug,
  getStorefrontProduct,
  type StorefrontSeller,
} from "@/lib/storefront";

/**
 * Optional single-tenant preview: when set, demo routes (`/store/{template}`
 * with no seller slug) can load that seller from Supabase. Live seller pages
 * always resolve from the URL `[slug]` — never from this env var.
 */
export function liveStoreSlug(): string {
  return process.env.NEXT_PUBLIC_STORE_SLUG?.trim() ?? "";
}

export function isLiveStorefrontCatalog(): boolean {
  return Boolean(liveStoreSlug());
}

async function storefrontContext(storeSlug: string) {
  if (!storeSlug || !isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const seller = await getSellerByStoreSlug(supabase, storeSlug);
  if (!seller) return null;
  return { supabase, seller };
}

async function envPreviewSeller() {
  const slug = liveStoreSlug();
  if (!slug) return null;
  return storefrontContext(slug);
}

export async function getStorefrontSellerBySlug(storeSlug: string): Promise<StorefrontSeller | null> {
  const ctx = await storefrontContext(storeSlug);
  return ctx?.seller ?? null;
}

export async function listProductsForStoreSlug(storeSlug: string): Promise<Product[]> {
  const ctx = await storefrontContext(storeSlug);
  if (!ctx) return [];
  return getActiveProductsForSeller(ctx.supabase, ctx.seller.id);
}

export async function getProductForStoreSlug(
  storeSlug: string,
  productId: string
): Promise<Product | null> {
  const ctx = await storefrontContext(storeSlug);
  if (!ctx) return null;
  return getStorefrontProduct(ctx.supabase, productId, ctx.seller.id);
}

export async function getSellerFaqsForStoreSlug(storeSlug: string): Promise<StoreFaq[]> {
  const ctx = await storefrontContext(storeSlug);
  return ctx?.seller.faqs ?? [];
}

export async function getPublishedBlogPostsForStoreSlug(
  storeSlug: string,
  limit = 3
): Promise<StoreBlogPost[]> {
  const ctx = await storefrontContext(storeSlug);
  if (!ctx) return [];
  return getPublishedBlogPosts(ctx.supabase, ctx.seller.id, limit);
}

export type RideFilterFacets = {
  tags: string[];
  engineSizes: string[];
  colours: string[];
  years: number[];
};

function uniqueSortedNames(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function uniqueSortedYears(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => b - a);
}

export async function getRideFilterFacetsForStoreSlug(storeSlug: string): Promise<RideFilterFacets> {
  const ctx = await storefrontContext(storeSlug);
  if (!ctx) return { tags: [], engineSizes: [], colours: [], years: [] };

  const { data, error } = await ctx.supabase
    .from("product_filter_options")
    .select("kind, name")
    .eq("seller_id", ctx.seller.id);

  if (error || !data?.length) return { tags: [], engineSizes: [], colours: [], years: [] };

  const tags: string[] = [];
  const engineSizes: string[] = [];
  const colours: string[] = [];
  const years: number[] = [];
  for (const row of data) {
    const name = String(row.name ?? "").trim();
    if (!name) continue;
    if (row.kind === "tag") tags.push(name);
    if (row.kind === "engine_size") engineSizes.push(name);
    if (row.kind === "colour") colours.push(name);
    if (row.kind === "year") {
      const year = Number(name);
      if (Number.isInteger(year)) years.push(year);
    }
  }

  return {
    tags: uniqueSortedNames(tags),
    engineSizes: uniqueSortedNames(engineSizes),
    colours: uniqueSortedNames(colours),
    years: uniqueSortedYears(years),
  };
}

/** @deprecated Prefer `listProductsForStoreSlug` on live seller routes. */
export async function listLiveProducts(): Promise<Product[]> {
  const ctx = await envPreviewSeller();
  if (!ctx) return [];
  return getActiveProductsForSeller(ctx.supabase, ctx.seller.id);
}

/** @deprecated Prefer `getProductForStoreSlug` on live seller routes. */
export async function getLiveProduct(productId: string): Promise<Product | null> {
  const ctx = await envPreviewSeller();
  if (!ctx) return null;
  return getStorefrontProduct(ctx.supabase, productId, ctx.seller.id);
}

/** @deprecated Prefer `getSellerFaqsForStoreSlug` on live seller routes. */
export async function getLiveSellerFaqs(): Promise<StoreFaq[]> {
  const ctx = await envPreviewSeller();
  return ctx?.seller.faqs ?? [];
}

/** @deprecated Prefer `getStorefrontSellerBySlug` on live seller routes. */
export async function getLiveStorefrontSeller(): Promise<StorefrontSeller | null> {
  const ctx = await envPreviewSeller();
  return ctx?.seller ?? null;
}

/** @deprecated Prefer `getPublishedBlogPostsForStoreSlug` on live seller routes. */
export async function getLivePublishedBlogPosts(limit = 3): Promise<StoreBlogPost[]> {
  const ctx = await envPreviewSeller();
  if (!ctx) return [];
  return getPublishedBlogPosts(ctx.supabase, ctx.seller.id, limit);
}

/** @deprecated Prefer `getRideFilterFacetsForStoreSlug` on live seller routes. */
export async function getLiveRideFilterFacets(): Promise<RideFilterFacets> {
  const slug = liveStoreSlug();
  if (!slug) return { tags: [], engineSizes: [], colours: [], years: [] };
  return getRideFilterFacetsForStoreSlug(slug);
}
