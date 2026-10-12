export type GaEventParams = Record<string, string | number | boolean | undefined>;

export const GA_MEASUREMENT_ID = "G-6SNH1NCQ3Z";

export function trackGaEvent(name: string, params?: GaEventParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
