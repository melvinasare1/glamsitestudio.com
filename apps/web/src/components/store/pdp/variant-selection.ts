import type { ProductVariant } from "@glamsite/shared/types";

export type VariantAxis = {
  name: string;
  values: string[];
};

export function isSizeAxisName(name: string): boolean {
  return name.trim().toLowerCase() === "size";
}

export function isColorAxisName(name: string): boolean {
  const label = name.trim().toLowerCase();
  return label === "color" || label === "colour";
}

function uniqueValues(values: string[]): string[] {
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

export function axesFromVariants(variants: ProductVariant[] | undefined): VariantAxis[] {
  if (!variants?.length) return [];

  const axes: VariantAxis[] = [];
  for (const row of variants) {
    const name = (
      row.name?.trim() ||
      (row.color ? "Color" : "") ||
      (row.size ? "Size" : "")
    ).trim();
    if (!name) continue;

    const fromValues = row.values?.length
      ? uniqueValues(row.values)
      : uniqueValues([row.size ?? "", row.color ?? ""]);
    if (fromValues.length === 0) continue;

    axes.push({ name, values: fromValues });
  }
  return axes;
}

/**
 * Use the generic multi-axis PDP path when variants[] includes any axis that
 * is not literally Size / Color / Colour. Plain Size+Color (or empty) stays
 * on the legacy sizes[] / colors[] selectors.
 */
export function usesGenericVariantAxes(variants: ProductVariant[] | undefined): boolean {
  const axes = axesFromVariants(variants);
  if (axes.length === 0) return false;
  return axes.some((axis) => !isSizeAxisName(axis.name) && !isColorAxisName(axis.name));
}

export function initialSelectedVariants(axes: VariantAxis[]): Record<string, string> {
  return Object.fromEntries(axes.map((axis) => [axis.name, axis.values[0] ?? ""]));
}

export function variantDisplaySuffix(input: {
  size?: string;
  color?: string;
  selectedVariants?: Record<string, string>;
}): string {
  const selected = input.selectedVariants;
  if (selected && Object.keys(selected).length > 0) {
    return Object.entries(selected)
      .filter(([, value]) => Boolean(value?.trim()))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => `${name}: ${value.trim()}`)
      .join(" / ");
  }
  return [input.size, input.color].filter(Boolean).join(" / ");
}
