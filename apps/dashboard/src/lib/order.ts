import type { ServerClient } from "./business";

/**
 * Swap a row with its neighbour and rewrite `position` for the whole list, so
 * positions stay 0…n-1 even after deletes. `rows` must already be in display order.
 */
export async function moveRow(
  supabase: ServerClient,
  table: "services" | "service_categories" | "staff",
  rows: { id: string }[],
  id: string,
  delta: -1 | 1
): Promise<{ error: { message: string } | null }> {
  const index = rows.findIndex((row) => row.id === id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= rows.length) return { error: null };

  const ordered = [...rows];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

  for (const [position, row] of ordered.entries()) {
    const { error } = await supabase.from(table).update({ position }).eq("id", row.id);
    if (error) return { error };
  }
  return { error: null };
}

/** £/€/$ text → cents. "" → null (price on consultation). */
export function parsePrice(raw: string): { ok: true; cents: number | null } | { ok: false } {
  const value = raw.trim().replace(/[£€$,\s]/g, "");
  if (!value) return { ok: true, cents: null };
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) return { ok: false };
  return { ok: true, cents: Math.round(Number(value) * 100) };
}

export function centsToInput(cents: number | null): string {
  if (cents == null) return "";
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}
