"use server";

import { passwordResetEmail, sendEmail } from "@glamsite/shared/email";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { getDashboardUrl } from "@glamsite/shared/supabase/env";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Always the same shape, whether or not the email has an account (see below). */
const GENERIC_OK = { ok: true as const };
type PasswordResetResult = { ok: true } | { ok: false; error: string };

/**
 * Generates the recovery link ourselves and emails it through Resend,
 * instead of supabase.auth.resetPasswordForEmail() — which depends on
 * Supabase Auth's own email sending, and per docs/infrastructure.md that
 * only works once SMTP is hand-configured in the Supabase dashboard to
 * route through Resend. Doing it ourselves here means password resets work
 * the same way sign-up's sign-in-link email already does: always through
 * our own Resend sender, regardless of what's set in Supabase's dashboard.
 *
 * Never reveals whether the email has an account — generateLink errors for
 * an email with no user, but we return the same "check your inbox" message
 * either way so this can't be used to find out which emails are registered.
 */
export async function requestPasswordReset(rawEmail: string): Promise<PasswordResetResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Password reset isn't configured yet. Contact support." };
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (linkError || !link?.properties?.hashed_token) {
    // Covers "user not found" too — stay silent either way (see above).
    return GENERIC_OK;
  }

  const confirmUrl = new URL(`${getDashboardUrl()}/auth/confirm`);
  confirmUrl.searchParams.set("token_hash", link.properties.hashed_token);
  confirmUrl.searchParams.set("type", link.properties.verification_type);
  confirmUrl.searchParams.set("next", "/auth/reset-password");

  const sent = await sendEmail({ to: email, ...passwordResetEmail(confirmUrl.toString()) });
  if (!sent) {
    console.error("[login] could not email password reset link");
    return { ok: false, error: "Couldn't send your reset email. Try again." };
  }
  return GENERIC_OK;
}
