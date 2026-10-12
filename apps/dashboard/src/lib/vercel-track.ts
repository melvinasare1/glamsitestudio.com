import { track } from "@vercel/analytics";

type EventData = Record<string, string | number | boolean | null | undefined>;

function skip(event: string) {
  console.debug(`[analytics] ${event} skipped`);
}

/** Fire-and-forget. Plan-limit / network failures must never affect the caller. */
export function trackEvent(name: string, data?: EventData): void {
  try {
    void Promise.resolve(track(name, data)).catch(() => {
      skip(name);
    });
  } catch {
    skip(name);
  }
}
