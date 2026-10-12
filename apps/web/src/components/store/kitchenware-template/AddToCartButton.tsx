"use client";

import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { useAddToCartFeedback } from "@/components/store/cart-feedback";
import { KITCHENWARE_TEMPLATE_BASE } from "@/components/store/kitchenware-template/demo-catalog";
import { useCart } from "@/lib/cart-context";

const DEFAULT_CLASS =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#2B4239] px-3 py-1.5 text-[11px] font-medium text-[#F5F1E4]";

export function AddToCartButton({
  productId,
  name,
  priceCedis,
  image,
  quantity = 1,
  label = "+ Cart",
  className = DEFAULT_CLASS,
  iconOnly = false,
  redirectTo,
}: {
  productId: string;
  name: string;
  priceCedis: number;
  image: string;
  quantity?: number;
  label?: string;
  className?: string;
  iconOnly?: boolean;
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

  const idleLabel = iconOnly ? (
    <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
  ) : (
    label
  );

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
      {added ? (
        iconOnly ? (
          <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
        ) : (
          <>
            <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            Added
          </>
        )
      ) : (
        idleLabel
      )}
    </button>
  );
}

export function ProductCardActions({
  productId,
  name,
  priceCedis,
  image,
  storeBase = KITCHENWARE_TEMPLATE_BASE,
}: {
  productId: string;
  name: string;
  priceCedis: number;
  image: string;
  storeBase?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <AddToCartButton
        productId={productId}
        name={name}
        priceCedis={priceCedis}
        image={image}
        label="Buy Now"
        redirectTo={`${storeBase}/cart`}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#2B4239] px-3 py-1.5 text-[11px] font-medium text-[#F5F1E4]"
      />
      <AddToCartButton
        productId={productId}
        name={name}
        priceCedis={priceCedis}
        image={image}
        iconOnly
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2B4239]/30 bg-transparent text-[#2B4239]"
      />
    </div>
  );
}
