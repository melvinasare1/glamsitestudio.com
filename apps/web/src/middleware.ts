import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAppHost, normalizeHost, slugFromPlatformHost } from "@glamsite/shared/domain";

/**
 * One app serves every site (rule 6):
 *   bella.glamsitestudio.com/…   → /sites/bella/…
 *   www.bellahair.co.uk/…        → /sites/{slug of the business with that verified domain}/…
 *   glamsitestudio.com, localhost, *.vercel.app → marketing pages, /demo/…, /sites/… as-is
 */

function rewrite(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url);
}

/** Slug of the live business that has verified this custom domain. RLS only returns live sites. */
async function slugForCustomDomain(host: string): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;

  const endpoint = new URL("/rest/v1/businesses", base);
  endpoint.searchParams.set("select", "slug");
  endpoint.searchParams.set("custom_domain", `eq.${host}`);
  endpoint.searchParams.set("custom_domain_verified", "eq.true");
  endpoint.searchParams.set("limit", "1");

  try {
    const response = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!response.ok) return null;
    const rows = (await response.json()) as Array<{ slug?: unknown }>;
    return typeof rows[0]?.slug === "string" ? rows[0].slug : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host") ?? request.nextUrl.hostname);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") || isAppHost(host)) {
    return NextResponse.next();
  }

  const rest = pathname === "/" ? "" : pathname;

  const platformSlug = slugFromPlatformHost(host);
  if (platformSlug) {
    return rewrite(request, `/sites/${platformSlug}${rest}`);
  }

  const customSlug = await slugForCustomDomain(host);
  if (customSlug) {
    return rewrite(request, `/sites/${customSlug}${rest}`);
  }

  return rewrite(request, "/site-not-found");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)"],
};
