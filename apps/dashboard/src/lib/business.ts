import { unstable_noStore as noStore } from "next/cache";
import { billingFromRow, businessFromRow } from "@glamsite/shared/mappers";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";
import { createClient } from "@glamsite/shared/supabase/server";
import type { Business, BusinessBilling, OwnerUser } from "@glamsite/shared/types";

export type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type DashboardSession = {
  user: OwnerUser;
  business: Business | null;
  billing: BusinessBilling | null;
};

/** The signed-in owner and their business. One business per owner for now. */
export async function getDashboardSession(): Promise<DashboardSession | null> {
  noStore();
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) console.error("[dashboard] business lookup failed", error.message);

  let billing: BusinessBilling | null = null;
  if (row) {
    const { data: billingRow } = await supabase
      .from("business_billing")
      .select("*")
      .eq("business_id", row.id)
      .maybeSingle();
    billing = billingRow ? billingFromRow(billingRow) : null;
  }

  return {
    user: { id: user.id, email: user.email ?? null },
    business: row ? businessFromRow(row) : null,
    billing,
  };
}

/** The business for the current page; pages under /dashboard are only rendered once one exists. */
export async function requireBusiness(): Promise<{ session: DashboardSession; business: Business }> {
  const session = await getDashboardSession();
  if (!session?.business) throw new Error("No business is linked to this account.");
  return { session, business: session.business };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export const fail = (error: string): ActionResult => ({ ok: false, error });

/**
 * For server actions: the owner's Supabase client (RLS applies) and their business.
 * Every write below goes through this, so it is always scoped to one business (rule 7).
 */
export async function ownerContext(): Promise<
  { ok: true; supabase: ServerClient; business: Business } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has ended. Log in again." };

  const { data: row } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!row) return { ok: false, error: "No business is linked to this account." };

  return { ok: true, supabase, business: businessFromRow(row) };
}

/** Log a database error and return a message an owner can act on. */
export function dbError(context: string, error: { message: string; code?: string } | null): ActionResult {
  console.error(`[dashboard] ${context}`, error);
  return fail("Something went wrong saving that. Please try again.");
}
