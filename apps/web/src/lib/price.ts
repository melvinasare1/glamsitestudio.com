export function parsePriceCedis(price: string): number {
  const n = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function formatCedis(amount: number): string {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}
