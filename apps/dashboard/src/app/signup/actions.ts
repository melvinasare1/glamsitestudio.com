"use server";

import { randomBytes } from "node:crypto";
import { slugProblem, slugify } from "@glamsite/shared/domain";
import { sendEmail, signInLinkEmail } from "@glamsite/shared/email";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { getDashboardUrl } from "@glamsite/shared/supabase/env";
import { createClient } from "@glamsite/shared/supabase/server";
import { DEFAULT_TEMPLATE_ID } from "@glamsite/shared/templates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignupResult = { ok: true; checkEmail: boolean } | { ok: false; error: string };

function randomSuffix(): string {
  return randomBytes(3).toString("hex");
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "my";
  const clean = local.replace(/[^a-zA-Z0-9]+/g, " ").trim() || "My";
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return `${capitalized}'s site`.slice(0, 120);
}

/**
 * Shopify-style sign-up: email only, no plan choice, no payment. For a
 * brand-new email, creates the login and an empty draft business
 * immediately, then signs the owner into this browser so the very next
 * screen is their dashboard. Everything in the dashboard is open from day
 * one — the only thing gated on payment is launching the site (see
 * (owner)/actions.ts launchSite()).
 *
 * For an email that already has an account, we must NOT sign the requester
 * in directly: generateLink() happily mints a valid login token for
 * whichever account owns that email, new or not, and redeeming it
 * server-side (as this used to do unconditionally) let anyone who merely
 * knew a salon owner's email address get logged into that owner's dashboard
 * — no inbox access required. So for an existing email we only email the
 * link (via our own Resend sender, not Supabase's unconfigured auth email)
 * and ask the requester to open it from their own inbox, which is what
 * actually proves they are the account's owner.
 */
export async function startSignup(rawEmail: string): Promise<SignupResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Sign-up isn't configured yet. Contact support." };
  }

  // Creates the auth user if they're new, or finds them if they've signed up
  // before. GoTrue records the request under "signup" for a brand-new email
  // and "magiclink" for one that already has an account — that distinction
  // is exactly what tells us whether it's safe to sign the requester in
  // immediately below.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !link?.properties?.hashed_token || !link.user) {
    console.error("[signup] generateLink failed", linkError);
    return { ok: false, error: "Couldn't create your account. Try again." };
  }
  const ownerId = link.user.id;
  const isNewAccount = link.properties.verification_type === "signup";

  if (!isNewAccount) {
    // Existing account: email the link and stop. Built against our own
    // /auth/confirm route (same one the "reset password" email links to)
    // rather than GoTrue's hosted verify URL, so the token is only ever
    // redeemed once the recipient opens this from their own inbox. We never
    // learn here whether they actually do, which is the point.
    const confirmUrl = new URL(`${getDashboardUrl()}/auth/confirm`);
    confirmUrl.searchParams.set("token_hash", link.properties.hashed_token);
    confirmUrl.searchParams.set("type", link.properties.verification_type);
    confirmUrl.searchParams.set("next", "/");

    const sent = await sendEmail({ to: email, ...signInLinkEmail(confirmUrl.toString()) });
    if (!sent) {
      console.error("[signup] could not email sign-in link");
      return { ok: false, error: "Couldn't send your sign-in link. Try again." };
    }
    return { ok: true, checkEmail: true };
  }

  // Brand-new account: nobody can be impersonated yet, so it's safe to
  // redeem the token ourselves and sign the requester straight in.
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: link.properties.verification_type,
    token_hash: link.properties.hashed_token,
  });
  if (verifyError) {
    console.error("[signup] verifyOtp failed", verifyError);
    return { ok: false, error: "Couldn't sign you in. Try again." };
  }

  const name = nameFromEmail(email);
  const baseSlug = slugify(email.split("@")[0] ?? "") || "site";

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomSuffix()}`;
    if (slugProblem(slug)) continue;

    const { data: business, error: businessError } = await admin
      .from("businesses")
      .insert({ owner_id: ownerId, name, slug, template_id: DEFAULT_TEMPLATE_ID, email })
      .select("id")
      .single();

    if (!businessError && business) {
      const [billing, booking, emailSettings] = await Promise.all([
        admin.from("business_billing").insert({ business_id: business.id }),
        admin.from("booking_settings").insert({ business_id: business.id }),
        admin.from("email_notification_settings").insert({ business_id: business.id }),
      ]);
      if (billing.error || booking.error || emailSettings.error) {
        console.error("[signup] supporting rows failed", billing.error, booking.error, emailSettings.error);
      }
      return { ok: true, checkEmail: false };
    }

    if (businessError?.code !== "23505") {
      console.error("[signup] business insert failed", businessError);
      return { ok: false, error: "Something went wrong setting up your site. Try again." };
    }
    // 23505 = slug already taken, retry with a random suffix.
  }

  return { ok: false, error: "Something went wrong setting up your site. Try again." };
}
