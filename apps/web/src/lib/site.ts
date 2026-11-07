import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  businessFromRow,
  categoryFromRow,
  openingHoursFromRow,
  serviceFromRow,
  staffFromRow,
} from "@glamsite/shared/mappers";
import { getSupabaseAnonKey, getSupabaseUrl } from "@glamsite/shared/supabase/env";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import type { SiteData } from "@glamsite/shared/types";

/** Public sites read as an anonymous visitor, so RLS only ever returns live, visible data. */
function publicClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function loadSections(supabase: SupabaseClient, slug: string, row: Record<string, unknown>): Promise<SiteData> {
  const businessId = row.id as string;
  const [categories, services, staff, hours] = await Promise.all([
    supabase.from("service_categories").select("*").eq("business_id", businessId).order("position"),
    supabase.from("services").select("*").eq("business_id", businessId).eq("is_visible", true).order("position"),
    supabase
      .from("staff")
      .select("*, staff_services(service_id)")
      .eq("business_id", businessId)
      .eq("is_visible", true)
      .order("position"),
    supabase.from("opening_hours").select("*").eq("business_id", businessId).order("weekday").order("opens_at"),
  ]);

  for (const result of [categories, services, staff, hours]) {
    if (result.error) console.error("[site] section load failed", { slug, error: result.error.message });
  }

  // Never ship the preview token to the browser — apps/web has no use for it,
  // and templates never need it, live or draft.
  const business = businessFromRow(row);
  business.previewToken = "";

  return {
    business,
    categories: (categories.data ?? []).map(categoryFromRow),
    services: (services.data ?? []).map(serviceFromRow),
    staff: (staff.data ?? []).map(staffFromRow),
    hours: (hours.data ?? []).map(openingHoursFromRow),
  };
}

/** Everything a template needs for one live site, or null if there's no live site at that slug. */
export const loadSite = cache(async (slug: string): Promise<SiteData | null> => {
  const supabase = publicClient();
  if (!supabase) return null;

  const { data: row, error } = await supabase.from("businesses").select("*").eq("slug", slug).maybeSingle();
  if (error) {
    console.error("[site] business lookup failed", { slug, error: error.message });
    return null;
  }
  if (!row) return null;

  return loadSections(supabase, slug, row);
});

/**
 * An owner's own draft preview, gated on the per-business preview_token in
 * the URL (not auth — the dashboard doesn't share a session with this app).
 * Uses the service-role client since draft businesses are invisible to the
 * anon role by design (businesses_read RLS); the token is the only check.
 */
export const loadDraftSite = cache(async (slug: string, token: string): Promise<SiteData | null> => {
  if (!token) return null;
  const supabase = createAdminClient();

  const { data: row, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("preview_token", token)
    .maybeSingle();
  if (error) {
    console.error("[site] draft preview lookup failed", { slug, error: error.message });
    return null;
  }
  if (!row) return null;

  return loadSections(supabase, slug, row);
});
