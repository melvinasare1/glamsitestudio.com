const PHONE_DIGIT_ERROR = "Phone number must be exactly 10 digits";

/** Remove all whitespace (leading, trailing, and internal). */
export function stripPhoneWhitespace(phone: string): string {
  return phone.replace(/\s/g, "");
}

export function phoneDigitCount(phone: string): number {
  return stripPhoneWhitespace(phone).replace(/\D/g, "").length;
}

export function isValidPhoneNumber(phone: string): boolean {
  return phoneDigitCount(phone) === 10;
}

/** Strip whitespace, keep digits only — used before writing to the database. */
export function normalizePhoneForStorage(phone: string): string {
  return stripPhoneWhitespace(phone).replace(/\D/g, "");
}

export function validatePhoneNumber(phone: string): { ok: true; normalized: string } | { ok: false; error: string } {
  const normalized = normalizePhoneForStorage(phone);
  if (normalized.length !== 10) {
    return { ok: false, error: PHONE_DIGIT_ERROR };
  }
  return { ok: true, normalized };
}

export { PHONE_DIGIT_ERROR };
