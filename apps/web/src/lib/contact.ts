const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EnquiryInput = {
  slug: string;
  name: string;
  email: string;
  phone: string;
  message: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function trim(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

/**
 * Validates a contact form post. `website` is a honeypot field that real
 * visitors never see; anything in it means a bot.
 */
export function parseEnquiry(
  raw: unknown
): { ok: true; data: EnquiryInput } | { ok: false; error: string; bot?: boolean } {
  const body = asRecord(raw);
  if (trim(body.website, 200)) return { ok: false, error: "Rejected.", bot: true };

  const slug = trim(body.slug, 63);
  const name = trim(body.name, 120);
  const email = trim(body.email, 254).toLowerCase();
  const phone = trim(body.phone, 40);
  const message = trim(body.message, 4000);

  if (!slug) return { ok: false, error: "Missing site." };
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!email && !phone) return { ok: false, error: "Please add an email or phone number so they can reply." };
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (!message) return { ok: false, error: "Please enter a message." };

  return { ok: true, data: { slug, name, email, phone, message } };
}

const CALLING_CODES: Record<string, string> = { GB: "44", IE: "353", US: "1", GH: "233", NG: "234" };

/** Digits for wa.me. A leading 0 is replaced with the business's country code. */
export function whatsappHref(phone: string, country: string): string | null {
  let digits = phone.trim().replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0") && CALLING_CODES[country]) digits = CALLING_CODES[country] + digits.slice(1);
  return digits.length >= 9 ? `https://wa.me/${digits}` : null;
}

export function telHref(phone: string): string | null {
  const digits = phone.trim().replace(/[^\d+]/g, "");
  return digits.replace(/\D/g, "").length >= 7 ? `tel:${digits}` : null;
}
