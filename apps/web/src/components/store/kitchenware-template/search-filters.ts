export type KitchenwareCatalogCard = {
  id: string;
  name: string;
  description: string;
  priceCedis: number;
  category: string;
  createdAt: number;
  image: string;
  colors: string[];
};

export type KitchenwareFilterFacets = {
  categories: string[];
};

export type SearchSort = "newest" | "price-asc" | "price-desc";

/** Product.category values used by the demo catalog and search filters. */
export const SEARCH_CATEGORIES = [
  { slug: "Drinkware", label: "Drinkware" },
  { slug: "Cookware", label: "Cookware" },
  { slug: "Tools", label: "Utensils" },
  { slug: "Serve", label: "Serveware" },
] as const;

export type KitchenwareCategorySlug = (typeof SEARCH_CATEGORIES)[number]["slug"];

export function parseRepeatParam(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function parseCategoryParam(values: string[]): string[] {
  return parseRepeatParam(values);
}

export function parseSearchSort(value: string | undefined): SearchSort {
  if (value === "price-asc" || value === "price-desc") return value;
  return "newest";
}

export function parsePriceBound(value: string | undefined): number | null {
  if (value == null || value.trim() === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}

export function productMatchesCategory(productCategory: string, selected: string): boolean {
  return productCategory.trim().toLowerCase() === selected.trim().toLowerCase();
}

export function uniqueSortedNames(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
