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
import type { SiteData } from "@glamsite/shared/types";

/** Public sites read as an anonymous visitor, so RLS only ever returns live, visible data. */
function publicClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
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

  return {
    business: businessFromRow(row),
    categories: (categories.data ?? []).map(categoryFromRow),
    services: (services.data ?? []).map(serviceFromRow),
    staff: (staff.data ?? []).map(staffFromRow),
    hours: (hours.data ?? []).map(openingHoursFromRow),
  };
});
