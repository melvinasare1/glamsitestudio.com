"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  CheckoutForm,
  PaymentInstructions,
} from "@/components/store/hair-beauty-template/CheckoutForm";
import { useCart } from "@/lib/cart-context";
import type { CheckoutSuccess } from "@/lib/checkout";
import { formatCedis } from "@/lib/price";

function isImageSrc(value: string) {
  return value.startsWith("http") || value.startsWith("/");
}

export function HairCartView({
  storeSlug,
  shopHref,
}: {
  storeSlug: string;
  shopHref: string;
}) {
  const { items, updateQuantity, removeItem, clearCart, totalCedis, hydrated } = useCart();
  const [receipt, setReceipt] = useState<CheckoutSuccess | null>(null);

  function handleCheckoutSuccess(next: CheckoutSuccess) {
    setReceipt(next);
    clearCart();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
      <h1
        className="text-2xl font-medium tracking-tight text-[#4f4a3d] sm:text-3xl"
        style={{ fontFamily: "var(--font-hair-display), ui-serif, Georgia" }}
      >
        Your cart
      </h1>

      {receipt ? (
        <PaymentInstructions receipt={receipt} shopHref={shopHref} />
      ) : !hydrated ? (
        <p className="mt-8 text-sm text-[#4f4a3d]/55">Loading your cart…</p>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-[#4f4a3d]/55">Your cart is empty.</p>
          <Link
            href={shopHref}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#8a8165] px-6 text-sm font-medium text-[#f7f1df] hover:bg-[#91886d]"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-[#d9cfc3] border-b border-[#d9cfc3]">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-4 py-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-[#efe6db]">
                  {isImageSrc(item.image) ? (
                    <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <span className="block h-full w-full bg-[#efe6db]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium leading-snug text-[#4f4a3d]">{item.name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#4f4a3d]">
                    {formatCedis(item.priceCedis)}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-[#d9cfc3] bg-white">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center"
                      >
                        <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => removeItem(item.productId)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#4f4a3d]/55 hover:bg-[#efe6db] hover:text-[#4f4a3d]"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between text-[15px] font-semibold text-[#4f4a3d]">
            <span>Total</span>
            <span>{formatCedis(totalCedis)}</span>
          </div>

          <CheckoutForm storeSlug={storeSlug} items={items} onSuccess={handleCheckoutSuccess} />
        </>
      )}
    </div>
  );
}
