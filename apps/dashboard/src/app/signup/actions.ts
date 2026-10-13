"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { slugProblem, slugify } from "@glamsite/shared/domain";
import { getDashboardUrl } from "@glamsite/shared/supabase/env";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { createClient } from "@glamsite/shared/supabase/server";
import { isTemplateId } from "@glamsite/shared/templates";

/**
 * Self-serve sign-up: creates the login, the business and its private rows.
 * Temporary until stage 3, when a paid Stripe Checkout creates the business
 * from a webhook instead.
 */

export type SignUpResult = { ok: true; needsEmailConfirmation: boolean } | { ok: false; error: string };

export async function checkSlug(raw: string): Promise<{ slug: string; available: boolean; error?: string }> {
  const slug = slugify(raw);
  const problem = slugProblem(slug);
  if (problem) return { slug, available: false, error: problem };
  try {
    const { data, error } = await createAdminClient().from("businesses").select("id").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return { slug, available: !data, error: data ? "That address is taken." : undefined };
  } catch {
    return { slug, available: false, error: "Couldn't check that address. Try again." };
  }
}

export async function signUpOwner(input: {
  email: string;
  password: string;
  businessName: string;
  slug: string;
  templateId: string;
}): Promise<SignUpResult> {
  const email = input.email.trim().toLowerCase();
  const businessName = input.businessName.trim().slice(0, 120);
  const slug = slugify(input.slug || businessName);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email." };
  if (input.password.length < 8) return { ok: false, error: "Use a password of at least 8 characters." };
  if (!businessName) return { ok: false, error: "Add your business name." };
  const problem = slugProblem(slug);
  if (problem) return { ok: false, error: problem };
  if (!isTemplateId(input.templateId)) return { ok: false, error: "Choose a template." };

  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Sign-up isn't configured yet. Contact support." };
  }

  const taken = await admin.from("businesses").select("id").eq("slug", slug).maybeSingle();
  if (taken.data) return { ok: false, error: "That web address is taken. Try another." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { emailRedirectTo: `${getDashboardUrl()}/auth/callback` },
  });
  if (error) {
    return /already|registered|exists/i.test(error.message)
      ? { ok: false, error: "There's already an account with this email. Log in instead." }
      : { ok: false, error: error.message };
  }
  const user = data.user;
  // Supabase returns a user with no identities when the email is already registered.
  if (!user || !user.identities?.length) {
    return { ok: false, error: "There's already an account with this email. Log in instead." };
  }

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .insert({ owner_id: user.id, name: businessName, slug, template_id: input.templateId, email })
    .select("id")
    .single();

  if (businessError || !business) {
    console.error("[signup] business insert failed", businessError);
    await admin.auth.admin.deleteUser(user.id).catch(() => undefined);
    if (data.session) await supabase.auth.signOut();
    return {
      ok: false,
      error: businessError?.code === "23505" ? "That web address was just taken. Try another." : "Couldn't create your site. Try again.",
    };
  }

  const [billing, booking] = await Promise.all([
    admin.from("business_billing").insert({ business_id: business.id }),
    admin.from("booking_settings").insert({ business_id: business.id }),
  ]);
  if (billing.error || booking.error) console.error("[signup] supporting rows failed", billing.error, booking.error);

  return { ok: true, needsEmailConfirmation: !data.session };
}
