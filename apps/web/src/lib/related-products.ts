import type { Product } from "@glamsite/shared/types";

export function pickRelatedCatalogProducts(
  current: Product,
  catalog: Product[],
  limit = 4
): Product[] {
  const others = catalog.filter((item) => item.id !== current.id);
  const category = (current.category ?? "").trim().toLowerCase();
  const same = category
    ? others.filter((item) => (item.category ?? "").trim().toLowerCase() === category)
    : [];
  const sameIds = new Set(same.map((item) => item.id));
  const rest = others.filter((item) => !sameIds.has(item.id));
  return [...same, ...rest].slice(0, limit);
}
