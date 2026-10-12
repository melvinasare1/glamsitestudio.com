"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  CheckoutForm,
  PaymentInstructions,
} from "@/components/store/imports-template/CheckoutForm";
import { useCart } from "@/lib/cart-context";
import type { CheckoutSuccess } from "@/lib/checkout";
import { formatCedis } from "@/lib/price";

function isImageSrc(value: string) {
  return value.startsWith("http") || value.startsWith("/");
}

export function ImportsCartView({
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
      <h1 className="text-2xl font-semibold tracking-tight text-[#1a1f2b] sm:text-3xl">Your cart</h1>

      {receipt ? (
        <PaymentInstructions receipt={receipt} shopHref={shopHref} />
      ) : !hydrated ? (
        <p className="mt-8 text-sm text-[#66707e]">Loading your cart…</p>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-[#66707e]">Your cart is empty.</p>
          <Link
            href={shopHref}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#1266b5] px-6 text-sm font-medium text-white hover:bg-[#0d4c88]"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-[#e4e8ef] border-b border-[#e4e8ef]">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-4 py-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#e8f1fa]">
                  {isImageSrc(item.image) ? (
                    <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <span className="block h-full w-full bg-[#e8f1fa]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium leading-snug text-[#1a1f2b]">{item.name}</p>
                  <p className="mt-1 text-sm font-bold text-[#1266b5]">{formatCedis(item.priceCedis)}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-lg border border-[#e4e8ef] bg-white">
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
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#66707e] hover:bg-[#e8f1fa] hover:text-[#1a1f2b]"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between text-[15px] font-semibold text-[#1a1f2b]">
            <span>Total</span>
            <span className="text-[#1266b5]">{formatCedis(totalCedis)}</span>
          </div>

          <CheckoutForm storeSlug={storeSlug} items={items} onSuccess={handleCheckoutSuccess} />
        </>
      )}
    </div>
  );
}
