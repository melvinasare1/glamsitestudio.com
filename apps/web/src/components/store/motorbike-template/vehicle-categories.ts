export const VEHICLE_CATEGORIES = [
  {
    slug: "motorbikes",
    label: "Motorbikes",
    aliases: ["motorbike", "motorbikes", "motorcycle", "motorcycles"],
  },
  {
    slug: "bicycles",
    label: "Bicycles",
    aliases: ["bicycle", "bicycles", "bike", "bikes", "e-bike", "e-bikes", "ebike", "ebikes"],
  },
  {
    slug: "mopeds",
    label: "Mopeds",
    aliases: ["moped", "mopeds"],
  },
  {
    slug: "scooters",
    label: "Scooters",
    aliases: ["scooter", "scooters"],
  },
] as const;

export type VehicleCategorySlug = (typeof VEHICLE_CATEGORIES)[number]["slug"];

export const ACCESSORY_CATEGORY_SLUG = "accessories" as const;

export type RideCategorySlug = VehicleCategorySlug | typeof ACCESSORY_CATEGORY_SLUG;

export const SEARCH_CATEGORIES = [
  ...VEHICLE_CATEGORIES,
  { slug: ACCESSORY_CATEGORY_SLUG, label: "Accessories" },
] as const;

const ACCESSORY_PARAM_ALIASES = new Set(["accessories", "accessory", "gear"]);

function normalizeCategoryValue(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function categoryKey(value: string): string {
  return normalizeCategoryValue(value).replace(/\s+/g, "");
}

export function parseVehicleCategoryParam(
  value: string | string[] | undefined
): RideCategorySlug[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const seen = new Set<RideCategorySlug>();
  for (const entry of raw) {
    const key = categoryKey(entry);
    if (ACCESSORY_PARAM_ALIASES.has(key)) {
      if (!seen.has(ACCESSORY_CATEGORY_SLUG)) seen.add(ACCESSORY_CATEGORY_SLUG);
      continue;
    }
    const match = VEHICLE_CATEGORIES.find(
      (category) => category.slug === key || category.aliases.some((alias) => categoryKey(alias) === key)
    );
    if (match && !seen.has(match.slug)) seen.add(match.slug);
  }
  return [...seen];
}

export function productMatchesVehicleCategory(
  productCategory: string,
  slug: RideCategorySlug
): boolean {
  if (slug === ACCESSORY_CATEGORY_SLUG) return isAccessoryCategory(productCategory);
  const key = categoryKey(productCategory);
  const category = VEHICLE_CATEGORIES.find((item) => item.slug === slug);
  if (!category || !key) return false;
  return category.slug === key || category.aliases.some((alias) => categoryKey(alias) === key);
}

export type SearchSort = "newest" | "price-asc" | "price-desc";

export function parseSearchSort(value: string | undefined): SearchSort {
  if (value === "price-asc" || value === "price-desc" || value === "newest") return value;
  return "newest";
}

export function parseRepeatParam(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    const name = entry.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function parseConditionParam(value: string | string[] | undefined): Array<"new" | "used"> {
  const out: Array<"new" | "used"> = [];
  for (const entry of parseRepeatParam(value)) {
    const key = entry.toLowerCase();
    if (key === "new" || key === "used") {
      if (!out.includes(key)) out.push(key);
    }
  }
  return out;
}

export function parseYearParam(value: string | string[] | undefined): number[] {
  const years: number[] = [];
  for (const entry of parseRepeatParam(value)) {
    const year = Number(entry);
    if (!Number.isInteger(year) || years.includes(year)) continue;
    years.push(year);
  }
  return years;
}

export function parsePriceBound(value: string | undefined): number | null {
  if (value == null || value.trim() === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}

const ACCESSORY_CATEGORY_ALIASES = [
  "helmet",
  "helmets",
  "gear",
  "accessory",
  "accessories",
  "part",
  "parts",
  "jacket",
  "jackets",
  "glove",
  "gloves",
  "boot",
  "boots",
  "trouser",
  "trousers",
] as const;

export function isAccessoryCategory(productCategory: string): boolean {
  const normalized = normalizeCategoryValue(productCategory);
  if (!normalized) return false;
  return ACCESSORY_CATEGORY_ALIASES.some((alias) => {
    const token = normalizeCategoryValue(alias);
    return normalized === token || normalized.includes(token);
  });
}

/** Other active listings to show under a product. Prefers gear/accessories. */
export function pickRelatedProducts<T extends { id: string; category: string }>(
  current: T,
  catalog: T[],
  limit = 4
): T[] {
  const others = catalog.filter((item) => item.id !== current.id);
  const accessories = others.filter((item) => isAccessoryCategory(item.category));
  const pool =
    accessories.length > 0
      ? accessories
      : others.filter((item) => categoryKey(item.category) !== categoryKey(current.category));
  return pool.slice(0, limit);
}
