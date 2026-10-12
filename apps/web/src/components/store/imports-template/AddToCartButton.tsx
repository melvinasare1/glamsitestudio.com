"use client";

import { Check, ShoppingCart } from "lucide-react";
import { useAddToCartFeedback } from "@/components/store/cart-feedback";
import { useCart } from "@/lib/cart-context";

export function AddToCartIconButton({
  productId,
  name,
  priceCedis,
  image,
}: {
  productId: string;
  name: string;
  priceCedis: number;
  image: string;
}) {
  const { addItem, hydrated } = useCart();
  const { added, notifyAdded } = useAddToCartFeedback();

  return (
    <button
      type="button"
      aria-label={added ? `${name} added to cart` : `Add ${name} to cart`}
      disabled={!hydrated}
      onClick={() => {
        if (!hydrated) return;
        addItem({ productId, name, priceCedis, image, quantity: 1 });
        notifyAdded();
      }}
      className="absolute right-2 bottom-2 z-10 inline-flex size-10 items-center justify-center rounded-full bg-[#1266b5] text-white shadow-sm transition-colors hover:bg-[#0d4c88] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1266b5] disabled:opacity-50"
    >
      {added ? (
        <Check className="size-4" strokeWidth={2.2} aria-hidden />
      ) : (
        <ShoppingCart className="size-4" strokeWidth={1.8} aria-hidden />
      )}
    </button>
  );
}
