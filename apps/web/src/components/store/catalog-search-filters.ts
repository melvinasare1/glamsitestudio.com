import { swatchHex } from "@/lib/swatch";

export type SearchSort = "newest" | "price-asc" | "price-desc";

export type CatalogFilterable = {
  name: string;
  description: string;
  category: string;
  priceCedis: number;
  createdAt: number;
  colors?: string[];
};

export type CatalogFilters = {
  query: string;
  categories: string[];
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: SearchSort;
};

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

export const ALL_CATEGORY = "All";

export function isAllCategory(value: string): boolean {
  return value.trim().toLowerCase() === "all";
}

export function productMatchesCategory(productCategory: string, selected: string): boolean {
  if (isAllCategory(selected)) return true;
  return productCategory.trim().toLowerCase() === selected.trim().toLowerCase();
}

export function productMatchesColor(productColors: string[] | undefined, selected: string): boolean {
  const want = selected.trim().toLowerCase();
  if (!want) return false;
  const wantHex = swatchHex(selected).toLowerCase();
  return (productColors ?? []).some((raw) => {
    const name = raw.trim().toLowerCase();
    const hex = swatchHex(raw).toLowerCase();
    return name === want || hex === wantHex || hex === want;
  });
}

export function filtersFromSearchParams(params: {
  get: (key: string) => string | null;
  getAll: (key: string) => string[];
}): CatalogFilters {
  return {
    query: params.get("q") ?? "",
    categories: parseRepeatParam(params.getAll("category")),
    colors: parseRepeatParam(params.getAll("color")),
    minPrice: parsePriceBound(params.get("min") ?? undefined),
    maxPrice: parsePriceBound(params.get("max") ?? undefined),
    sort: parseSearchSort(params.get("sort") ?? undefined),
  };
}

export function applyCatalogFilters<T extends CatalogFilterable>(
  products: T[],
  filters: CatalogFilters
): T[] {
  const needle = filters.query.trim().toLowerCase();
  const filtered = products.filter((product) => {
    if (needle) {
      const haystack = [product.name, product.description, product.category].join(" ").toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (filters.categories.length > 0) {
      const selected = filters.categories.filter((item) => !isAllCategory(item));
      if (selected.length > 0) {
        const matches = selected.some((item) => productMatchesCategory(product.category, item));
        if (!matches) return false;
      }
    }
    if (filters.colors.length > 0) {
      const matches = filters.colors.some((item) => productMatchesColor(product.colors, item));
      if (!matches) return false;
    }
    if (filters.minPrice != null && product.priceCedis < filters.minPrice) return false;
    if (filters.maxPrice != null && product.priceCedis > filters.maxPrice) return false;
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (filters.sort === "price-asc") return a.priceCedis - b.priceCedis;
    if (filters.sort === "price-desc") return b.priceCedis - a.priceCedis;
    return b.createdAt - a.createdAt;
  });
}

export function toggleNamedValue(current: string[], value: string): string[] {
  const key = value.toLowerCase();
  const exists = current.some((item) => item.toLowerCase() === key);
  return exists ? current.filter((item) => item.toLowerCase() !== key) : [...current, value];
}

export function setRepeatParam(params: URLSearchParams, key: string, values: string[]) {
  params.delete(key);
  for (const value of values) params.append(key, value);
}
