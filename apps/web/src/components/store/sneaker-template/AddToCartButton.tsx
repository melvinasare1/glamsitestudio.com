"use client";

import { useRouter } from "next/navigation";
import { useAddToCartFeedback } from "@/components/store/cart-feedback";
import { useCart } from "@/lib/cart-context";

export function AddToCartButton({
  productId,
  name,
  priceCedis,
  image,
  quantity = 1,
  label = "Add to Cart",
  className,
  redirectTo,
}: {
  productId: string;
  name: string;
  priceCedis: number;
  image: string;
  quantity?: number;
  label?: string;
  className?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { addItem, hydrated } = useCart();
  const { added, notifyAdded } = useAddToCartFeedback();

  function handleClick() {
    if (!hydrated) return;
    addItem({ productId, name, priceCedis, image, quantity });
    if (redirectTo) {
      router.push(redirectTo);
      return;
    }
    notifyAdded();
  }

  return (
    <button
      type="button"
      aria-label={
        added
          ? `${name} added to cart`
          : redirectTo
            ? `Buy ${name} now`
            : `Add ${name} to cart`
      }
      onClick={handleClick}
      disabled={!hydrated}
      className={className}
    >
      {added && !redirectTo ? "Added" : label}
    </button>
  );
}

const ADD_CLASS =
  "inline-flex h-11 flex-1 items-center justify-center rounded-full border border-[#3C2415]/25 bg-[#F5F0EA] px-3 text-[13px] font-semibold text-[#2A1C14] transition hover:bg-white disabled:opacity-50";
const BUY_CLASS =
  "inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#3C2415] px-3 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50";

export function ProductCardActions({
  productId,
  name,
  priceCedis,
  image,
  cartHref,
}: {
  productId: string;
  name: string;
  priceCedis: number;
  image: string;
  cartHref: string;
}) {
  return (
    <div className="mt-4 flex gap-2">
      <AddToCartButton
        productId={productId}
        name={name}
        priceCedis={priceCedis}
        image={image}
        className={ADD_CLASS}
      />
      <AddToCartButton
        productId={productId}
        name={name}
        priceCedis={priceCedis}
        image={image}
        label="Buy Now"
        redirectTo={cartHref}
        className={BUY_CLASS}
      />
    </div>
  );
}
