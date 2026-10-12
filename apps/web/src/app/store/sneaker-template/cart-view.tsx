"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  CheckoutForm,
  PaymentInstructions,
} from "@/components/store/sneaker-template/CheckoutForm";
import { useCart } from "@/lib/cart-context";
import type { CheckoutSuccess } from "@/lib/checkout";
import { formatCedis } from "@/lib/price";

function isImageSrc(value: string) {
  return value.startsWith("http") || value.startsWith("/");
}

export function SneakerCartView({
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
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1
        className="text-[32px] font-semibold text-[#2A1C14]"
        style={{ fontFamily: "var(--font-kicks-display), ui-serif, Georgia" }}
      >
        Your cart
      </h1>

      {receipt ? (
        <PaymentInstructions receipt={receipt} shopHref={shopHref} />
      ) : !hydrated ? (
        <p className="mt-6 text-sm text-[#2A1C14]/45">Loading your cart…</p>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <p className="text-sm text-[#2A1C14]/55">Your cart is empty.</p>
          <Link
            href={shopHref}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#3C2415] py-3 text-sm font-semibold text-white"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3 border-b border-[#3C2415]/15 pb-5">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#E8E2D9]">
                  {isImageSrc(item.image) ? (
                    <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <span
                      className="block h-full w-full"
                      style={{ backgroundColor: item.image || "#3C2415" }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3 text-sm font-semibold">
                    <span className="leading-tight">{item.name}</span>
                    <span className="shrink-0">{formatCedis(item.priceCedis)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-[#3C2415]/20">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center"
                      >
                        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => removeItem(item.productId)}
                      className="flex h-7 w-7 items-center justify-center text-[#2A1C14]/45 hover:text-[#2A1C14]"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between font-bold">
            <span>Total</span>
            <span>{formatCedis(totalCedis)}</span>
          </div>

          <CheckoutForm storeSlug={storeSlug} items={items} onSuccess={handleCheckoutSuccess} />
        </>
      )}
    </div>
  );
}
