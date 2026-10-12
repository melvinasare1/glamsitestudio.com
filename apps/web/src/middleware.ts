import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isPlatformPassThroughHost,
  normalizeStoreHost,
} from "@glamsite/shared/store-domain";
import { parseStorefrontTemplate, STOREFRONT_TEMPLATES } from "@glamsite/shared/types";

const TEMPLATE_SEGMENTS = new Set<string>(STOREFRONT_TEMPLATES);

function hostnameOf(request: NextRequest): string {
  const host = request.headers.get("host") ?? request.nextUrl.hostname;
  return normalizeStoreHost(host);
}

function withPathnameHeader(request: NextRequest, pathname: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return requestHeaders;
}

function passThrough(request: NextRequest) {
  return NextResponse.next({
    request: { headers: withPathnameHeader(request, request.nextUrl.pathname) },
  });
}

function shouldSkipSellerRewrite(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/store/") ||
    pathname.startsWith("/__host-not-found")
  );
}

function hostNotFound(request: NextRequest) {
  const notFoundUrl = request.nextUrl.clone();
  notFoundUrl.pathname = "/__host-not-found";
  return NextResponse.rewrite(notFoundUrl, {
    request: { headers: withPathnameHeader(request, "/__host-not-found") },
  });
}

type SellerRoute = { template: string; store_slug: string };

/** `/store/{slug}/...` when `{slug}` is not a template demo route. */
function publicStorePath(pathname: string): { slug: string; rest: string } | null {
  if (!pathname.startsWith("/store/")) return null;
  const after = pathname.slice("/store/".length);
  if (!after) return null;
  const slash = after.indexOf("/");
  const raw = slash === -1 ? after : after.slice(0, slash);
  const slug = raw.toLowerCase();
  if (!slug || TEMPLATE_SEGMENTS.has(slug)) return null;
  return { slug, rest: slash === -1 ? "" : after.slice(slash) };
}

async function lookupSeller(
  column: "domain" | "store_slug",
  value: string
): Promise<SellerRoute | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !value) return null;

  const endpoint = new URL("/rest/v1/sellers", url);
  endpoint.searchParams.set("select", "template,store_slug,domain");
  endpoint.searchParams.set(column, `eq.${value}`);
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!response.ok) return null;

  const rows = (await response.json()) as Array<{
    template?: unknown;
    store_slug?: unknown;
  }>;
  const row = rows[0];
  const template = row?.template;
  const storeSlug = row?.store_slug;
  if (typeof template !== "string" || !template) return null;
  if (typeof storeSlug !== "string" || !storeSlug) return null;
  return { template, store_slug: storeSlug };
}

function rewriteStorefront(request: NextRequest, rewritePath: string) {
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = rewritePath;
  return NextResponse.rewrite(rewriteUrl, {
    request: { headers: withPathnameHeader(request, rewritePath) },
  });
}

export async function middleware(request: NextRequest) {
  const hostname = hostnameOf(request);
  const pathname = request.nextUrl.pathname;

  const publicStore = publicStorePath(pathname);
  if (publicStore && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(publicStore.slug)) {
    const seller = await lookupSeller("store_slug", publicStore.slug);
    if (seller) {
      const rewritePath = `/store/${parseStorefrontTemplate(seller.template)}/${seller.store_slug}${publicStore.rest}`;
      return rewriteStorefront(request, rewritePath);
    }
  }

  if (isPlatformPassThroughHost(hostname) || shouldSkipSellerRewrite(pathname)) {
    return passThrough(request);
  }

  const seller = await lookupSeller("domain", hostname);
  if (!seller) {
    return hostNotFound(request);
  }

  const rest = pathname === "/" ? "" : pathname;
  const rewritePath = `/store/${parseStorefrontTemplate(seller.template)}/${seller.store_slug}${rest}`;
  return rewriteStorefront(request, rewritePath);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)"],
};
