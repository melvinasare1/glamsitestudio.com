const SESSION_STORAGE_KEY = "glamsite_sid";
const PRODUCT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TrackEventType = "page_view" | "product_view";

export type TrackBody = {
  storeSlug: string;
  path: string;
  sessionId: string;
  productId?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function trim(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Anonymous browser session id in localStorage. Not a cookie. */
export function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY)?.trim();
    if (existing) return existing.slice(0, 64);
    const id = newSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, id);
    return id;
  } catch {
    return "";
  }
}

export function parseTrackBody(
  raw: unknown
): { ok: true; data: TrackBody } | { ok: false; error: string } {
  const body = asRecord(raw);
  const storeSlug = trim(body.storeSlug, 80);
  const path = trim(body.path, 500);
  const sessionId = trim(body.sessionId, 64);
  const productIdRaw = trim(body.productId, 36);

  if (!storeSlug) return { ok: false, error: "Missing store." };
  if (!path) return { ok: false, error: "Missing path." };
  if (!sessionId) return { ok: false, error: "Missing session." };

  const productId = PRODUCT_UUID_RE.test(productIdRaw) ? productIdRaw : undefined;
  return { ok: true, data: { storeSlug, path, sessionId, productId } };
}

/** Fire-and-forget. Tracking failures must not affect the page. */
export function trackStorefrontView(input: {
  storeSlug: string;
  path: string;
  productId?: string;
}): void {
  if (typeof window === "undefined") return;
  const sessionId = getOrCreateSessionId();
  if (!sessionId || !input.storeSlug || !input.path) return;

  const body: TrackBody = {
    storeSlug: input.storeSlug,
    path: input.path,
    sessionId,
    productId: input.productId,
  };

  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}
