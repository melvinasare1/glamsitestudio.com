import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@glamsite/shared/supabase/env";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/auth/reset-password";
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(url.searchParams.get("next"));

  const successUrl = new URL(next, url.origin);
  const errorUrl = new URL("/auth/reset-password", url.origin);
  errorUrl.searchParams.set(
    "error",
    "This reset link is invalid or expired. Request a new one from the login page."
  );

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(errorUrl);
  }

  let response = NextResponse.redirect(successUrl);
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.redirect(successUrl);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(errorUrl);
    return response;
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return NextResponse.redirect(errorUrl);
    return response;
  }

  return NextResponse.redirect(errorUrl);
}
