"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  CheckoutForm,
  PaymentInstructions,
} from "@/components/store/kitchenware-template/CheckoutForm";
import { useCart } from "@/lib/cart-context";
import type { CheckoutSuccess } from "@/lib/checkout";
import { formatCedis } from "@/lib/price";

function isImageSrc(value: string) {
  return value.startsWith("http") || value.startsWith("/");
}

export function KitchenwareCartView({
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
    <div className="mx-auto max-w-xl px-6 py-12 md:px-10 md:py-16">
      <h1
        className="text-[32px] font-medium text-[#2B4239] md:text-[40px]"
        style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
      >
        Your cart
      </h1>

      {receipt ? (
        <PaymentInstructions receipt={receipt} shopHref={shopHref} />
      ) : !hydrated ? (
        <p className="mt-8 text-sm text-[#2B4239]/45">Loading your cart…</p>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-[#2B4239]/55">Your cart is empty.</p>
          <Link
            href={shopHref}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#2B4239] px-6 text-sm font-medium text-[#F5F1E4]"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-[#2B4239]/10 border-b border-[#2B4239]/10">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-4 py-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#EDE8DC]">
                  {isImageSrc(item.image) ? (
                    <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <span
                      className="block h-full w-full"
                      style={{ backgroundColor: item.image || "#2B4239" }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug text-[#2B4239]">{item.name}</p>
                  <p className="mt-1 text-sm text-[#2B4239]/70">{formatCedis(item.priceCedis)}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-[#2B4239]/15">
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
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#2B4239]/40 hover:bg-[#2B4239]/5 hover:text-[#2B4239]"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between text-[15px] font-semibold text-[#2B4239]">
            <span>Total</span>
            <span>{formatCedis(totalCedis)}</span>
          </div>

          <CheckoutForm
            storeSlug={storeSlug}
            items={items}
            onSuccess={handleCheckoutSuccess}
          />
        </>
      )}
    </div>
  );
}
