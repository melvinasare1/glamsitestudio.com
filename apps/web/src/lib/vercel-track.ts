import { track } from "@vercel/analytics/server";
import { headers } from "next/headers";

type EventData = Record<string, string | number | boolean | null | undefined>;

function skip(event: string) {
  console.debug(`[analytics] ${event} skipped`);
}

function requestHeaders(): Headers | undefined {
  try {
    return headers();
  } catch {
    return undefined;
  }
}

/** Fire-and-forget. Plan-limit / network failures must never affect the caller. */
export function trackEvent(name: string, data?: EventData): void {
  try {
    const hdrs = requestHeaders();
    void Promise.resolve(track(name, data, hdrs ? { headers: hdrs } : undefined)).catch(() => {
      skip(name);
    });
  } catch {
    skip(name);
  }
}
