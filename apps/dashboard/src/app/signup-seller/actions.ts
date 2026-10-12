"use server";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { isReservedStoreSubdomain } from "@glamsite/shared/store-domain";
import { slugifyStoreName } from "@/lib/store-slug";
import { trackEvent } from "@/lib/vercel-track-server";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { createClient } from "@glamsite/shared/supabase/server";
import {
  parsePricingTier,
  parseStorefrontTemplate,
  type PricingTier,
  type Seller,
} from "@glamsite/shared/types";
import { normalizePhoneForStorage, validatePhoneNumber } from "@/lib/phone";
import { newSellerInsertRow } from "./seller-row";

export type SignUpSellerResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { error: string; resumeProfile?: boolean };

type SellerSignupFields = {
  businessName: string;
  storeSlug: string;
  phone: string;
  momoPhone: string;
  template: Seller["template"];
  pricingTier: PricingTier;
  productCategory: string;
};

function formatPostgresError(err: PostgrestError) {
  return [err.message, err.details, err.hint].filter(Boolean).join(". ");
}

function normalizeSignupFields(input: SellerSignupFields) {
  const businessName = input.businessName.trim();
  const phone = normalizePhoneForStorage(input.phone);
  const momoPhone = normalizePhoneForStorage(input.momoPhone);
  const template = parseStorefrontTemplate(input.template);
  const pricingTier = parsePricingTier(input.pricingTier);
  const productCategory = input.productCategory.trim();
  const baseSlug = slugifyStoreName(input.storeSlug || businessName);
  return { businessName, phone, momoPhone, template, pricingTier, productCategory, baseSlug };
}

function validateSignupFields(fields: {
  businessName: string;
  phone: string;
  momoPhone: string;
  baseSlug: string;
  productCategory: string;
}) {
  if (!fields.businessName) return "Business name is required.";
  if (!fields.productCategory) return "Product category is required.";
  const phoneCheck = validatePhoneNumber(fields.phone);
  if (!phoneCheck.ok) return phoneCheck.error;
  const momoCheck = validatePhoneNumber(fields.momoPhone);
  if (!momoCheck.ok) return momoCheck.error;
  if (!fields.baseSlug) return "Store slug must use letters or numbers.";
  if (isReservedStoreSubdomain(fields.baseSlug)) {
    return "That store URL is reserved. Choose a different slug.";
  }
  return null;
}

export async function checkStoreSlugAvailable(
  rawSlug: string
): Promise<{ slug: string; available: boolean; error?: string }> {
  const slug = slugifyStoreName(rawSlug);
  if (!slug) return { slug, available: false, error: "Store slug must use letters or numbers." };
  if (isReservedStoreSubdomain(slug)) {
    return { slug, available: false, error: "That store URL is reserved. Choose a different slug." };
  }

  let supabase: SupabaseClient;
  try {
    supabase = createAdminClient();
  } catch {
    return { slug, available: false, error: "Could not check that store URL. Try again." };
  }

  const { data, error } = await supabase
    .from("sellers")
    .select("id")
    .eq("store_slug", slug)
    .maybeSingle();

  if (error) {
    return { slug, available: false, error: "Could not check that store URL. Try again." };
  }

  return { slug, available: !data };
}

export async function signUpSeller(input: {
  email: string;
  password: string;
  businessName: string;
  storeSlug: string;
  phone: string;
  momoPhone: string;
  template: Seller["template"];
  pricingTier: PricingTier;
  productCategory: string;
}): Promise<SignUpSellerResult> {
  try {
    return await signUpSellerInner(input);
  } catch (err) {
    console.error("[signup-seller] unexpected error", err);
    return {
      error: err instanceof Error ? err.message : "Could not create the account. Try again.",
    };
  }
}

async function signUpSellerInner(input: {
  email: string;
  password: string;
  businessName: string;
  storeSlug: string;
  phone: string;
  momoPhone: string;
  template: Seller["template"];
  pricingTier: PricingTier;
  productCategory: string;
}): Promise<SignUpSellerResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const fields = normalizeSignupFields(input);

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  const fieldError = validateSignupFields(fields);
  if (fieldError) return { error: fieldError };

  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        "Seller signup is not configured. Set SUPABASE_SERVICE_ROLE_KEY so we can create the sellers row.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const alreadyRegistered = /already registered|already exists|already been registered/i.test(
      error.message
    );
    if (alreadyRegistered) {
      return {
        error:
          "An account with this email already exists. Log in, then finish your seller profile if the dashboard asks you to.",
      };
    }
    return { error: error.message };
  }

  const user = data.user;
  if (!user) {
    return { error: "Could not create the account. Try again." };
  }
  if (!user.identities || user.identities.length === 0) {
    return {
      error:
        "An account with this email already exists. Log in, then finish your seller profile if the dashboard asks you to.",
    };
  }

  const inserted = await insertSellerRow(admin, {
    userId: user.id,
    email,
    businessName: fields.businessName,
    phone: fields.phone,
    momoPhone: fields.momoPhone,
    template: fields.template,
    pricingTier: fields.pricingTier,
    productCategory: fields.productCategory,
    baseSlug: fields.baseSlug,
  });

  if (inserted.ok) {
    return { ok: true, needsEmailConfirmation: !data.session };
  }

  if (inserted.alreadyHasProfile) {
    return { error: "An account for this email already has a seller profile. Log in instead." };
  }

  const rolledBack = await rollbackAuthUser(admin, user.id);
  if (rolledBack) {
    if (data.session) {
      await supabase.auth.signOut();
    }
    return { error: inserted.error };
  }

  if (data.session) {
    return {
      error: `${inserted.error} Your login exists without a seller profile. Finish it on the next screen.`,
      resumeProfile: true,
    };
  }

  return {
    error: `${inserted.error} Your login was created without a seller profile. Confirm your email, log in, then finish your profile.`,
  };
}

export async function completeSellerProfile(
  input: SellerSignupFields
): Promise<SignUpSellerResult> {
  try {
    const fields = normalizeSignupFields(input);
    const fieldError = validateSignupFields(fields);
    if (fieldError) return { error: fieldError };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Log in first, then finish your seller profile." };
    }

    let admin: SupabaseClient;
    try {
      admin = createAdminClient();
    } catch {
      return {
        error:
          "Seller signup is not configured. Set SUPABASE_SERVICE_ROLE_KEY so we can create the sellers row.",
      };
    }

    const email = (user.email ?? "").trim().toLowerCase();
    if (!email) {
      return { error: "This account has no email. Contact Glam Site Studios." };
    }

    const inserted = await insertSellerRow(admin, {
      userId: user.id,
      email,
      businessName: fields.businessName,
      phone: fields.phone,
      momoPhone: fields.momoPhone,
      template: fields.template,
      pricingTier: fields.pricingTier,
      productCategory: fields.productCategory,
      baseSlug: fields.baseSlug,
    });

    if (inserted.ok || inserted.alreadyHasProfile) {
      return { ok: true, needsEmailConfirmation: false };
    }

    return { error: inserted.error, resumeProfile: true };
  } catch (err) {
    console.error("[signup-seller] complete profile unexpected error", err);
    return {
      error: err instanceof Error ? err.message : "Could not create the seller profile. Try again.",
      resumeProfile: true,
    };
  }
}

async function insertSellerRow(
  admin: SupabaseClient,
  input: {
    userId: string;
    email: string;
    businessName: string;
    phone: string;
    momoPhone: string;
    template: Seller["template"];
    pricingTier: PricingTier;
    productCategory: string;
    baseSlug: string;
  }
): Promise<{ ok: true } | { ok: false; error: string; alreadyHasProfile?: boolean }> {
  const row = newSellerInsertRow({
    userId: input.userId,
    businessName: input.businessName,
    storeSlug: input.baseSlug,
    email: input.email,
    phone: input.phone,
    momoPhone: input.momoPhone,
    template: input.template,
    pricingTier: input.pricingTier,
  });

  const { error: insertError } = await admin.from("sellers").insert(row);
  if (!insertError) {
    if (input.productCategory) {
      const { error: categoryError } = await admin.from("product_categories").insert({
        seller_id: input.userId,
        name: input.productCategory,
      });
      if (categoryError) {
        console.error("[signup-seller] product category insert failed", categoryError);
      }
    }
    trackEvent("seller_signed_up");
    return { ok: true };
  }

  console.error("[signup-seller] sellers insert failed", {
    code: insertError.code,
    message: insertError.message,
    details: insertError.details,
    hint: insertError.hint,
    userId: input.userId,
    storeSlug: input.baseSlug,
  });

  const isSlugTaken =
    insertError.code === "23505" &&
    (insertError.message.includes("store_slug") || insertError.message.includes("sellers_store_slug"));
  const isIdTaken =
    insertError.code === "23505" &&
    (insertError.message.includes("sellers_pkey") ||
      insertError.message.includes("sellers_uid") ||
      insertError.message.includes("(id)") ||
      insertError.message.includes("(uid)"));

  if (isIdTaken) {
    return { ok: false, error: formatPostgresError(insertError), alreadyHasProfile: true };
  }
  if (isSlugTaken) {
    return { ok: false, error: "That store URL is taken. Go back and choose a different slug." };
  }
  if (
    insertError.code === "23514" &&
    (insertError.message.includes("sellers_store_slug_not_reserved") ||
      insertError.message.includes("store_slug"))
  ) {
    return { ok: false, error: "That store URL is reserved. Choose a different slug." };
  }

  return { ok: false, error: formatPostgresError(insertError) };
}

async function rollbackAuthUser(admin: SupabaseClient, userId: string) {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[signup-seller] failed to roll back auth user", {
      userId,
      message: error.message,
      status: error.status,
    });
    return false;
  }
  return true;
}
