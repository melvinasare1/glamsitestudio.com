import { unstable_noStore as noStore } from "next/cache";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sellerFromRow } from "@glamsite/shared/mappers";
import {
  parseStorefrontContent,
  type StorefrontContent,
} from "@glamsite/shared/storefront-content-schema";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";
import { createClient } from "@glamsite/shared/supabase/server";
import type { Seller, SellerUser } from "@glamsite/shared/types";

/** Look up the seller whose id (preferred) or uid matches the signed-in user. */
export async function fetchSellerForAuthUser(
  supabase: SupabaseClient,
  uid: string
): Promise<Seller | null> {
  if (!uid) return null;

  const byId = await supabase.from("sellers").select("*").eq("id", uid).maybeSingle();
  if (byId.data) return sellerFromRow(byId.data);

  const byUid = await supabase.from("sellers").select("*").eq("uid", uid).maybeSingle();
  if (byUid.data) return sellerFromRow(byUid.data);

  return null;
}

/**
 * Flip trialing → overdue when trial_ends_at has passed.
 * Billing columns are service-role only (see sellers_protect_billing_columns).
 */
export async function reconcileSubscriptionStatus(seller: Seller): Promise<Seller> {
  const trialEnded =
    seller.trialEndsAt != null &&
    Number.isFinite(seller.trialEndsAt) &&
    seller.trialEndsAt <= Date.now();
  if (seller.subscriptionStatus !== "trialing" || !trialEnded) {
    return seller;
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("sellers")
      .update({ subscription_status: "overdue" })
      .eq("id", seller.id)
      .eq("subscription_status", "trialing");
    if (error) {
      console.error("Failed to reconcile subscription_status", error);
      return { ...seller, subscriptionStatus: "overdue" };
    }
  } catch (err) {
    console.error("Failed to reconcile subscription_status", err);
  }

  return { ...seller, subscriptionStatus: "overdue" };
}

/** Fresh store_content for the editor — do not rely on layout-cached seller context. */
export async function fetchSellerStoreContent(sellerId: string): Promise<StorefrontContent> {
  noStore();
  if (!sellerId || !isSupabaseConfigured()) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sellers")
    .select("store_content")
    .eq("id", sellerId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load seller store_content", error);
    return {};
  }
  return parseStorefrontContent(data?.store_content);
}

export async function getDashboardSession(): Promise<{
  user: SellerUser;
  seller: Seller | null;
  sellerError: string | null;
} | null> {
  noStore();
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let seller = await fetchSellerForAuthUser(supabase, user.id);
  if (seller) {
    seller = await reconcileSubscriptionStatus(seller);
  }
  return {
    user: { uid: user.id, email: user.email ?? null },
    seller,
    sellerError: seller
      ? null
      : "No seller profile is linked to this account. Finish creating it so your Auth user id matches sellers.id.",
  };
}

/**
 * Seller identity for dashboard API routes.
 * Verifies the Auth JWT from cookies (set by @supabase/ssr) and returns
 * the seller id, which equals auth.uid() once the seller row is created.
 */
export async function requireSellerSession(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; sellerId: string } | NextResponse
> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  return { supabase, sellerId: user.id };
}
