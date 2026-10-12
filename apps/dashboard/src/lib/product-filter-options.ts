import type { SupabaseClient } from "@supabase/supabase-js";
import type { SellerCategory } from "@/lib/product-categories";

export type FilterOptionKind = "tag" | "engine_size" | "colour" | "year";

export const FILTER_OPTION_DEFAULTS: Record<FilterOptionKind, string[]> = {
  tag: ["Commuter", "Sport", "Adventure", "Electric", "Gear"],
  engine_size: ["50cc", "125cc", "250cc", "400cc", "650cc", "Electric"],
  colour: ["Black", "White", "Orange", "Grey", "Red"],
  year: ["2022", "2023", "2024", "2025", "2026"],
};

export type FilterOptionSets = Record<FilterOptionKind, SellerCategory[]>;

function emptySets(): FilterOptionSets {
  return { tag: [], engine_size: [], colour: [], year: [] };
}

function asKind(value: unknown): FilterOptionKind | null {
  if (value === "tag" || value === "engine_size" || value === "colour" || value === "year") {
    return value;
  }
  return null;
}

export async function listSellerFilterOptions(
  supabase: SupabaseClient,
  sellerId: string
): Promise<FilterOptionSets> {
  const grouped = emptySets();
  const { data, error } = await supabase
    .from("product_filter_options")
    .select("id, kind, name")
    .eq("seller_id", sellerId)
    .order("name", { ascending: true });

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return grouped;
    throw new Error(error.message);
  }

  if (!data?.length) {
    const rows = (Object.keys(FILTER_OPTION_DEFAULTS) as FilterOptionKind[]).flatMap((kind) =>
      FILTER_OPTION_DEFAULTS[kind].map((name) => ({ seller_id: sellerId, kind, name }))
    );
    const seeded = await supabase.from("product_filter_options").insert(rows).select("id, kind, name");
    if (!seeded.error && seeded.data) {
      for (const row of seeded.data) {
        const kind = asKind(row.kind);
        const name = String(row.name ?? "").trim();
        if (!kind || !name) continue;
        grouped[kind].push({ id: String(row.id), name });
      }
      return grouped;
    }
  }

  for (const row of data ?? []) {
    const kind = asKind(row.kind);
    const name = String(row.name ?? "").trim();
    if (!kind || !name) continue;
    grouped[kind].push({ id: String(row.id), name });
  }
  return grouped;
}

export async function createSellerFilterOption(
  supabase: SupabaseClient,
  sellerId: string,
  kind: FilterOptionKind,
  rawName: string
): Promise<SellerCategory> {
  const name = rawName.trim();
  if (!name) throw new Error("Enter a name.");

  const { data, error } = await supabase
    .from("product_filter_options")
    .insert({ seller_id: sellerId, kind, name })
    .select("id, name")
    .single();

  if (!error && data) {
    return { id: String(data.id), name: String(data.name) };
  }

  if (error?.code === "23505") {
    const existing = await supabase
      .from("product_filter_options")
      .select("id, name")
      .eq("seller_id", sellerId)
      .eq("kind", kind)
      .eq("name", name)
      .maybeSingle();
    if (existing.data) {
      return { id: String(existing.data.id), name: String(existing.data.name) };
    }
  }

  if (error?.code === "42P01" || error?.code === "PGRST205") {
    return { id: `local:${kind}:${name}`, name };
  }

  throw new Error(error?.message ?? "Could not save that option.");
}

export async function renameSellerFilterOption(
  supabase: SupabaseClient,
  sellerId: string,
  option: SellerCategory,
  kind: FilterOptionKind,
  rawName: string
): Promise<SellerCategory> {
  const name = rawName.trim();
  if (!name) throw new Error("Enter a name.");
  if (option.id.startsWith("local:")) {
    return { id: `local:${kind}:${name}`, name };
  }
  const { data, error } = await supabase
    .from("product_filter_options")
    .update({ name })
    .eq("id", option.id)
    .eq("seller_id", sellerId)
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);
  return { id: String(data.id), name: String(data.name) };
}

export async function deleteSellerFilterOption(
  supabase: SupabaseClient,
  sellerId: string,
  option: SellerCategory
): Promise<void> {
  if (option.id.startsWith("local:")) return;
  const { error } = await supabase
    .from("product_filter_options")
    .delete()
    .eq("id", option.id)
    .eq("seller_id", sellerId);
  if (error && error.code !== "42P01" && error.code !== "PGRST205") {
    throw new Error(error.message);
  }
}
