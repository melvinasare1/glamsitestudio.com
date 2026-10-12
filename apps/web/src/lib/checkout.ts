import type { OrderItem } from "@glamsite/shared/types";
import { variantDisplaySuffix } from "@/components/store/pdp/variant-selection";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRODUCT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export type CartVariantSelection = {
  size?: string;
  color?: string;
  selectedVariants?: Record<string, string>;
};

export type CheckoutItemInput = {
  productId: string;
  name: string;
  quantity: number;
  size?: string;
  color?: string;
  selectedVariants?: Record<string, string>;
};

export type CheckoutBody = {
  storeSlug: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  deliveryAddress: string;
  items: CheckoutItemInput[];
};

export type CheckoutMomo = {
  accountName: string;
  number: string;
  configured: boolean;
  instructions: string;
};

export type CheckoutSuccess = {
  orderId: string;
  paymentReference: string;
  subtotalCedis: number;
  momo: CheckoutMomo;
};

export type ParsedCheckout = {
  storeSlug: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  deliveryAddress: string;
  items: CheckoutItemInput[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function trim(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function parseSelectedVariants(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entries: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const name = trim(key, 80);
    const selected = trim(raw, 80);
    if (!name || !selected) continue;
    entries[name] = selected;
  }
  return Object.keys(entries).length > 0 ? entries : undefined;
}

function encodeVariantPair(name: string, value: string): string {
  return `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
}

function selectionFingerprint(selection: CartVariantSelection): string {
  const selected = selection.selectedVariants;
  if (selected && Object.keys(selected).length > 0) {
    return Object.entries(selected)
      .filter(([, value]) => Boolean(value?.trim()))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => encodeVariantPair(name.trim(), value.trim()))
      .join("|");
  }
  if (!selection.size && !selection.color) return "";
  return `${selection.size ?? ""}:${selection.color ?? ""}`;
}

export function productIdFromCartLine(lineId: string): string {
  const match = lineId.trim().match(PRODUCT_UUID_RE);
  return match?.[0] ?? "";
}

/**
 * Composite cart line key. Legacy size/color products keep the
 * `uuid:size:color` form. Multi-axis selections use sorted
 * `uuid:name=value|name=value` so distinct combinations do not collide.
 */
export function cartLineId(
  productId: string,
  sizeOrSelection?: string | CartVariantSelection,
  color?: string
): string {
  const selection: CartVariantSelection =
    sizeOrSelection && typeof sizeOrSelection === "object"
      ? sizeOrSelection
      : { size: sizeOrSelection, color };

  const fingerprint = selectionFingerprint(selection);
  if (!fingerprint) return productId;
  return `${productId}:${fingerprint}`;
}

export function checkoutItemsPayload(
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    size?: string;
    color?: string;
    selectedVariants?: Record<string, string>;
  }>
): CheckoutItemInput[] {
  return items.map((item) => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    selectedVariants: item.selectedVariants,
  }));
}

export async function submitCheckout(
  body: CheckoutBody
): Promise<{ ok: true; receipt: CheckoutSuccess } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload: unknown = await response.json().catch(() => null);
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: unknown }).error ?? "")
        : "";

    if (!response.ok) {
      return { ok: false, error: message || "Could not place your order. Please try again." };
    }

    const receipt = payload as CheckoutSuccess;
    if (!receipt?.orderId || !receipt.paymentReference) {
      return {
        ok: false,
        error: "Order was created but the confirmation was incomplete. Check with the seller.",
      };
    }

    return { ok: true, receipt };
  } catch (err) {
    console.error("Checkout request failed", err);
    return { ok: false, error: "Could not reach checkout. Check your connection and try again." };
  }
}

export function parseCheckoutBody(raw: unknown): { ok: true; data: ParsedCheckout } | { ok: false; error: string } {
  const body = asRecord(raw);
  const storeSlug = trim(body.storeSlug, 80);
  const buyerName = trim(body.buyerName, 120);
  const buyerEmail = trim(body.buyerEmail, 254).toLowerCase();
  const buyerPhone = trim(body.buyerPhone, 40);
  const deliveryAddress = trim(body.deliveryAddress, 500);

  if (!storeSlug) return { ok: false, error: "Missing store." };
  if (!buyerName) return { ok: false, error: "Please enter your name." };
  if (!buyerEmail || !EMAIL_RE.test(buyerEmail)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!buyerPhone) return { ok: false, error: "Please enter your phone number." };
  if (!deliveryAddress) return { ok: false, error: "Please enter a delivery address." };

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items: CheckoutItemInput[] = [];
  for (const entry of rawItems) {
    const fields = asRecord(entry);
    const productId = productIdFromCartLine(String(fields.productId ?? ""));
    const quantity = Number(fields.quantity);
    if (!productId) {
      return { ok: false, error: "Your bag has an invalid item. Remove it and try again." };
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false, error: "Each item needs a quantity between 1 and 99." };
    }
    items.push({
      productId,
      name: trim(fields.name, 200) || "Item",
      quantity,
      size: trim(fields.size, 40) || undefined,
      color: trim(fields.color, 40) || undefined,
      selectedVariants: parseSelectedVariants(fields.selectedVariants),
    });
  }

  if (items.length === 0) {
    return { ok: false, error: "Your bag is empty." };
  }

  return {
    ok: true,
    data: { storeSlug, buyerName, buyerEmail, buyerPhone, deliveryAddress, items },
  };
}

export function paymentReference(): string {
  const raw = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `ANS-${raw}`;
}

export function momoDetails(input: {
  businessName: string;
  phone: string;
  paymentReference: string;
  subtotalCedis: number;
}): CheckoutMomo {
  const accountName = input.businessName.trim() || "Seller";
  const number = input.phone.trim();
  const configured = Boolean(number);
  const amount = `GHS ${input.subtotalCedis.toLocaleString("en-GH")}`;
  const instructions = configured
    ? `Send ${amount} by Mobile Money to ${number} (${accountName}). Use ${input.paymentReference} as the reference so the seller can match your payment.`
    : `This seller has not published a MoMo number yet. Save reference ${input.paymentReference} and wait for them to share payment details. Your order is held as awaiting payment.`;

  return {
    accountName,
    number: configured ? number : "Not configured yet",
    configured,
    instructions,
  };
}

export function orderItemsFromCatalog(
  requested: CheckoutItemInput[],
  catalog: Map<string, { name: string; priceCedis: number }>
): { ok: true; items: OrderItem[]; subtotalCedis: number } | { ok: false; error: string } {
  const items: OrderItem[] = [];
  let subtotalCedis = 0;

  for (const line of requested) {
    const product = catalog.get(line.productId);
    if (!product) {
      return {
        ok: false,
        error: "One or more items are no longer available. Refresh the page and try again.",
      };
    }
    const suffix = variantDisplaySuffix({
      size: line.size,
      color: line.color,
      selectedVariants: line.selectedVariants,
    });
    const name = suffix ? `${product.name} · ${suffix}` : product.name;
    items.push({
      productId: line.productId,
      name,
      priceCedis: product.priceCedis,
      quantity: line.quantity,
      size: line.size,
      color: line.color,
      selectedVariants: line.selectedVariants,
    });
    subtotalCedis += product.priceCedis * line.quantity;
  }

  return { ok: true, items, subtotalCedis };
}
