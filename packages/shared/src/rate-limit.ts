/**
 * Fixed-window rate limiting backed by Postgres (check_rate_limit() in
 * supabase/migrations/20261105000000_rate_limits.sql). An in-memory counter
 * wouldn't work here: Vercel can run each request on a different serverless
 * instance, so counts would never add up. Every instance hits the same
 * database instead.
 *
 * Fails open: if the database call itself errors (misconfigured env,
 * transient outage), the request is allowed rather than blocking real
 * clients because of a rate-limit plumbing problem.
 */
import { createAdminClient } from "./supabase/admin";

/**
 * @param key Identifies who's being limited, e.g. `booking:book:203.0.113.4`.
 *   Prefix with the route so the same IP isn't sharing a budget across
 *   unrelated endpoints.
 * @param windowSeconds Length of the fixed window, e.g. 60.
 * @param maxRequests Max requests allowed per window.
 * @returns true if the request should proceed, false if it should be rejected (429).
 */
export async function withinRateLimit(key: string, windowSeconds: number, maxRequests: number): Promise<boolean> {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return true; // Not configured (e.g. local dev without service role) — don't block.
  }

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });
  if (error) {
    console.error("[rate-limit] check failed; allowing request", error.message);
    return true;
  }
  return Boolean(data);
}

/** Best-effort client IP from the standard proxy header Vercel sets. */
export function requestIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function tooManyRequests(message = "Too many requests. Please try again in a moment."): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": "30" },
  });
}
