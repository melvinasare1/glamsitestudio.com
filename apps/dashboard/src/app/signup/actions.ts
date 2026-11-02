"use server";

import { randomBytes } from "node:crypto";
import { slugProblem, slugify } from "@glamsite/shared/domain";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { createClient } from "@glamsite/shared/supabase/server";
import { DEFAULT_TEMPLATE_ID } from "@glamsite/shared/templates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignupResult = { ok: true } | { ok: false; error: string };

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
 * Shopify-style sign-up: email only, no plan choice, no payment. Creates the
 * login and an empty draft business immediately, then signs the owner into
 * this browser so the very next screen is their dashboard. Everything in the
 * dashboard is open from day one — the only thing gated on payment is
 * launching the site (see (owner)/actions.ts launchSite()).
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
  // before — either way we get a token we can redeem for a session below,
  // with no email round-trip needed.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !link?.properties?.hashed_token || !link.user) {
    console.error("[signup] generateLink failed", linkError);
    return { ok: false, error: "Couldn't create your account. Try again." };
  }
  const ownerId = link.user.id;

  // GoTrue stores the token under whichever type it actually used to handle
  // the request, not necessarily the "magiclink" we asked for — a brand-new
  // email has to be created first, which GoTrue records as "signup". Using
  // the wrong type here looks up the wrong token and fails as "expired".
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: link.properties.verification_type,
    token_hash: link.properties.hashed_token,
  });
  if (verifyError) {
    console.error("[signup] verifyOtp failed", verifyError);
    return { ok: false, error: "Couldn't sign you in. Try again." };
  }

  // Returning owner: they already have a site, nothing left to provision.
  const existing = await admin.from("businesses").select("id").eq("owner_id", ownerId).maybeSingle();
  if (existing.data) return { ok: true };

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
      return { ok: true };
    }

    if (businessError?.code !== "23505") {
      console.error("[signup] business insert failed", businessError);
      return { ok: false, error: "Something went wrong setting up your site. Try again." };
    }
    // 23505 = slug already taken, retry with a random suffix.
  }

  return { ok: false, error: "Something went wrong setting up your site. Try again." };
}
