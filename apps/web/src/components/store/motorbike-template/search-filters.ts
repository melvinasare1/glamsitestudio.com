import type { ProductCondition } from "@glamsite/shared/types";

export type RideFilterFacets = {
  tags: string[];
  engineSizes: string[];
  colours: string[];
  years: number[];
};

export type RideCatalogCard = {
  id: string;
  name: string;
  description: string;
  priceCedis: number;
  category: string;
  createdAt: number;
  image: string;
  colors: string[];
  colourNames: string[];
  tags: string[];
  engineSize?: string;
  condition?: ProductCondition;
  year?: number;
  rating?: number;
};

const NAMED_COLOUR_HEX: Record<string, string[]> = {
  black: ["#111111", "#000000", "#0a0a0a"],
  white: ["#ffffff", "#fff", "#fffdfa"],
  orange: ["#e8622c"],
  grey: ["#808080", "#6b7280", "#9ca3af", "#4b5563"],
  gray: ["#808080", "#6b7280", "#9ca3af", "#4b5563"],
  red: ["#ef4444", "#dc2626", "#ff0000", "#b91c1c"],
};

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

export function namedColoursFromSwatches(colors: string[]): string[] {
  return uniqueSortedNames(colors.filter((color) => color.trim() && !color.trim().startsWith("#")));
}

export function productMatchesColour(product: RideCatalogCard, colour: string): boolean {
  const wanted = colour.trim().toLowerCase();
  if (!wanted) return false;
  if (product.colourNames.some((name) => name.trim().toLowerCase() === wanted)) return true;
  if (product.colors.some((value) => !value.trim().startsWith("#") && value.trim().toLowerCase() === wanted)) {
    return true;
  }
  const hexes = NAMED_COLOUR_HEX[wanted] ?? [];
  return product.colors.some((value) => hexes.includes(value.trim().toLowerCase().replace(/\s+/g, "")));
}
