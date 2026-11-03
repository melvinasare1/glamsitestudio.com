/**
 * Server-side PostHog capture for events that happen inside an API route,
 * not in the browser (e.g. a booking that completes without payment, where
 * there's no client-side "success" moment to hang a track() call off).
 *
 * Uses a plain fetch to PostHog's capture endpoint instead of the
 * `posthog-node` package, so there's no flush/shutdown lifecycle to manage
 * in a serverless function — one POST, no batching, nothing to leak across
 * invocations.
 */
export async function trackServer(businessId: string, event: string, properties?: Record<string, unknown>): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com";
  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: `business_${businessId}`,
        properties: { business_id: businessId, $process_person_profile: false, ...properties },
      }),
    });
  } catch (error) {
    console.error("[track] server event failed", { event, error });
  }
}
