import type { CartItem } from "@/lib/cart-context";
import {
  checkoutItemsPayload,
  momoDetails,
  paymentReference,
  submitCheckout,
  type CheckoutSuccess,
} from "@/lib/checkout";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";

/** Preview-only MoMo number for dummy template catalogs. */
export const PREVIEW_MOMO_NUMBER = "0240000000";

export function isPreviewCartLine(productId: string): boolean {
  return productId.startsWith("demo-");
}

export function completePreviewCheckout(
  items: CartItem[]
): { ok: true; receipt: CheckoutSuccess } | { ok: false; error: string } {
  let subtotalCedis = 0;
  for (const item of items) {
    if (!isPreviewCartLine(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return { ok: false, error: "Your bag has an invalid item. Remove it and try again." };
    }
    subtotalCedis += item.priceCedis * item.quantity;
  }

  const reference = paymentReference();
  return {
    ok: true,
    receipt: {
      orderId: crypto.randomUUID(),
      paymentReference: reference,
      subtotalCedis,
      momo: momoDetails({
        businessName: DEFAULT_STORE_NAME,
        phone: PREVIEW_MOMO_NUMBER,
        paymentReference: reference,
        subtotalCedis,
      }),
    },
  };
}

export async function checkoutCart(input: {
  storeSlug: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  deliveryAddress: string;
  items: CartItem[];
}): Promise<{ ok: true; receipt: CheckoutSuccess } | { ok: false; error: string }> {
  const previewCount = input.items.filter((item) => isPreviewCartLine(item.productId)).length;
  if (previewCount > 0 && previewCount < input.items.length) {
    return { ok: false, error: "Your bag has an invalid item. Remove it and try again." };
  }
  if (previewCount === input.items.length) {
    return completePreviewCheckout(input.items);
  }
  return submitCheckout({
    storeSlug: input.storeSlug,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    buyerPhone: input.buyerPhone,
    deliveryAddress: input.deliveryAddress,
    items: checkoutItemsPayload(input.items),
  });
}
