import type { SupabaseClient } from "@supabase/supabase-js";

export type SellerCategory = {
  id: string;
  name: string;
};

export async function listSellerCategories(
  supabase: SupabaseClient,
  sellerId: string
): Promise<SellerCategory[]> {
  const fromTable = await supabase
    .from("product_categories")
    .select("id, name")
    .eq("seller_id", sellerId)
    .order("name", { ascending: true });

  const names = new Map<string, SellerCategory>();

  if (!fromTable.error) {
    for (const row of fromTable.data ?? []) {
      const name = String(row.name ?? "").trim();
      if (!name) continue;
      names.set(name.toLowerCase(), { id: String(row.id), name });
    }
  }

  const fromProducts = await supabase.from("products").select("category").eq("seller_id", sellerId);
  if (!fromProducts.error) {
    for (const row of fromProducts.data ?? []) {
      const name = String(row.category ?? "").trim();
      if (!name || names.has(name.toLowerCase())) continue;
      names.set(name.toLowerCase(), { id: `local:${name}`, name });
    }
  }

  return [...names.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function createSellerCategory(
  supabase: SupabaseClient,
  sellerId: string,
  rawName: string
): Promise<SellerCategory> {
  const name = rawName.trim();
  if (!name) throw new Error("Enter a category name.");

  const { data, error } = await supabase
    .from("product_categories")
    .insert({ seller_id: sellerId, name })
    .select("id, name")
    .single();

  if (!error && data) {
    return { id: String(data.id), name: String(data.name) };
  }

  if (error?.code === "23505") {
    const existing = await supabase
      .from("product_categories")
      .select("id, name")
      .eq("seller_id", sellerId)
      .eq("name", name)
      .maybeSingle();
    if (existing.data) {
      return { id: String(existing.data.id), name: String(existing.data.name) };
    }
  }

  // Table missing or RLS blocked: keep it on the form until the product is saved.
  if (error?.code === "42P01" || error?.code === "PGRST205") {
    return { id: `local:${name}`, name };
  }

  throw new Error(error?.message ?? "Could not create category.");
}

export async function renameSellerCategory(
  supabase: SupabaseClient,
  sellerId: string,
  category: SellerCategory,
  rawName: string
): Promise<SellerCategory> {
  const name = rawName.trim();
  if (!name) throw new Error("Enter a category name.");
  if (category.id.startsWith("local:")) {
    return { id: `local:${name}`, name };
  }
  const { data, error } = await supabase
    .from("product_categories")
    .update({ name })
    .eq("id", category.id)
    .eq("seller_id", sellerId)
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);
  return { id: String(data.id), name: String(data.name) };
}

export async function deleteSellerCategory(
  supabase: SupabaseClient,
  sellerId: string,
  category: SellerCategory
): Promise<void> {
  if (category.id.startsWith("local:")) return;
  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", category.id)
    .eq("seller_id", sellerId);
  if (error && error.code !== "42P01" && error.code !== "PGRST205") {
    throw new Error(error.message);
  }
}
