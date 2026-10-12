const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CONTACT_WHATSAPP_GREETING =
  "Hello, I'd like to get in touch about your store.";

export type ContactSubmitInput = {
  storeSlug: string;
  name: string;
  email: string;
  message: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function trim(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

export function parseContactSubmitBody(
  raw: unknown
): { ok: true; data: ContactSubmitInput } | { ok: false; error: string } {
  const body = asRecord(raw);
  const storeSlug = trim(body.storeSlug, 80);
  const name = trim(body.name, 120);
  const email = trim(body.email, 254).toLowerCase();
  const message = trim(body.message, 2000);

  if (!storeSlug) return { ok: false, error: "Missing store." };
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!message) return { ok: false, error: "Please enter a message." };

  return { ok: true, data: { storeSlug, name, email, message } };
}

/** Digits for wa.me, with a leading Ghana 0 converted to 233. */
export function whatsappDigits(phone: string): string | null {
  const raw = phone.trim();
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length >= 9) {
    digits = `233${digits.slice(1)}`;
  }
  if (digits.length < 9) return null;
  return digits;
}

export function whatsappHref(phone: string, message: string): string | null {
  const digits = whatsappDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function telHref(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 7) return null;
  return `tel:${digits}`;
}
