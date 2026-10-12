"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  CheckoutForm,
  PaymentInstructions,
} from "@/components/store/template-a/CheckoutForm";
import { useCart } from "@/lib/cart-context";
import type { CheckoutSuccess } from "@/lib/checkout";
import { formatCedis } from "@/lib/price";

const ACCENT = "#FF7A1A";

function isImageSrc(value: string) {
  return value.startsWith("http") || value.startsWith("/");
}

export function TemplateACartView({
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
    <div className="mx-auto max-w-xl">
      <h1 className="text-[28px] font-extrabold tracking-tight md:text-[32px]">Your bag</h1>

      {receipt ? (
        <PaymentInstructions receipt={receipt} shopHref={shopHref} />
      ) : !hydrated ? (
        <p className="mt-8 text-sm text-black/45">Loading your bag…</p>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-black/55">Your bag is empty.</p>
          <Link
            href={shopHref}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-semibold text-white"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-black/10 border-b border-black/10">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-4 py-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-black">
                  {isImageSrc(item.image) ? (
                    <Image src={item.image} alt={item.name} fill sizes="80px" className="object-contain" />
                  ) : (
                    <span
                      className="block h-full w-full"
                      style={{ backgroundColor: item.image || "#C4C4C4" }}
                      aria-hidden
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold leading-snug">{item.name}</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: ACCENT }}>
                    {formatCedis(item.priceCedis)}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-black/10">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center text-black"
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
                        className="flex h-8 w-8 items-center justify-center text-black"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => removeItem(item.productId)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between text-[15px] font-bold">
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
