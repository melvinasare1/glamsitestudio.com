"use client";

import posthog from "posthog-js";

let initialized = false;

/**
 * Starts PostHog once per page load and tags every event from here on with
 * which salon it's for, so the dashboard's Analytics page can filter events
 * down to one business (the same scoping every Supabase query already does).
 * No-ops if the env var isn't set, so local dev without a PostHog key still
 * works, it just doesn't send anything.
 */
export function initAnalytics(businessId: string): void {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  if (!initialized) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
      // Owners' clients are anonymous visitors, not PostHog "identified"
      // people — we only ever need aggregate counts, never a visitor profile.
      person_profiles: "identified_only",
    });
    initialized = true;
  }
  posthog.register({ business_id: businessId });
}

/** Fires a custom event, tagged with whatever initAnalytics registered. No-ops if PostHog never started. */
export function track(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture(event, properties);
}
