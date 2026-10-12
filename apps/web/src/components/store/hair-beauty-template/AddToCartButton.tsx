"use client";

import { Check, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAddToCartFeedback } from "@/components/store/cart-feedback";
import { useCart } from "@/lib/cart-context";

type CartLineProps = {
  productId: string;
  name: string;
  priceCedis: number;
  image: string;
  size?: string;
  color?: string;
  selectedVariants?: Record<string, string>;
};

export function AddToCartIconButton({
  productId,
  name,
  priceCedis,
  image,
  size,
  color,
  selectedVariants,
}: CartLineProps) {
  const { addItem, hydrated } = useCart();
  const { added, notifyAdded } = useAddToCartFeedback();

  return (
    <button
      type="button"
      aria-label={added ? `${name} added to cart` : `Add ${name} to cart`}
      disabled={!hydrated}
      onClick={() => {
        if (!hydrated) return;
        addItem({
          productId,
          name,
          priceCedis,
          image,
          size,
          color,
          selectedVariants,
          quantity: 1,
        });
        notifyAdded();
      }}
      className="absolute right-2 bottom-2 z-10 inline-flex size-10 items-center justify-center rounded-full bg-[#8a8165] text-[#f7f1df] shadow-sm transition-colors hover:bg-[#91886d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a8165] disabled:opacity-50"
    >
      {added ? (
        <Check className="size-4" strokeWidth={2.2} aria-hidden />
      ) : (
        <ShoppingCart className="size-4" strokeWidth={1.8} aria-hidden />
      )}
    </button>
  );
}

export function BuyNowButton({
  productId,
  name,
  priceCedis,
  image,
  cartHref,
  size,
  color,
  selectedVariants,
}: CartLineProps & { cartHref: string }) {
  const router = useRouter();
  const { addItem, hydrated } = useCart();

  return (
    <button
      type="button"
      aria-label={`Buy ${name} now`}
      disabled={!hydrated}
      onClick={() => {
        if (!hydrated) return;
        addItem({
          productId,
          name,
          priceCedis,
          image,
          size,
          color,
          selectedVariants,
          quantity: 1,
        });
        router.push(cartHref);
      }}
      className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-full bg-[#8a8165] px-3 text-xs font-medium text-[#f7f1df] transition hover:bg-[#91886d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a8165] disabled:opacity-50 sm:h-10"
    >
      Buy now
    </button>
  );
}
