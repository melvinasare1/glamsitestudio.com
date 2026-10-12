import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Refresh the Auth session cookies, then gate seller-only routes.
 *
 * Storefront (`/store/...`) is intentionally not in the middleware matcher —
 * those pages stay public and never hit this function.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const path = request.nextUrl.pathname;
  const isDashboard = path === "/dashboard" || path.startsWith("/dashboard/");
  const isAuthPage = path === "/login" || path === "/signup-seller";
  // Server Actions POST to the current page. Redirecting those requests
  // (e.g. after signUp sets a session) makes Next return undefined to the
  // client — `"error" in result` then throws.
  const isServerAction = request.headers.has("next-action");

  if (!url || !key) {
    if (isDashboard) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
        if (headers) {
          Object.entries(headers).forEach(([header, value]) =>
            supabaseResponse.headers.set(header, value)
          );
        }
      },
    },
  });

  // Do not run code between createServerClient and getUser().
  // getUser() revalidates the JWT; getSession() must not be trusted here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isDashboard && !isServerAction) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (user && isAuthPage && !isServerAction) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
