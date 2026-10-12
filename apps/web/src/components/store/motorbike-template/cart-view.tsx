"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  RideCheckoutForm,
  RidePaymentInstructions,
} from "@/components/store/motorbike-template/checkout-form";
import { MotorbikePlaceholder } from "@/components/store/motorbike-template/placeholders";
import { rideStoreBase } from "@/components/store/motorbike-template/demo-catalog";
import { useCart } from "@/lib/cart-context";
import type { CheckoutSuccess } from "@/lib/checkout";
import { formatCedis } from "@/lib/price";

const ORANGE = "#E8622C";

function isImageSrc(value: string) {
  return value.startsWith("http") || value.startsWith("/");
}

export function RideCartView({ storeSlug }: { storeSlug: string }) {
  const shopHref = rideStoreBase(storeSlug && storeSlug !== "motorbike-template" ? storeSlug : undefined);
  const { items, updateQuantity, removeItem, clearCart, totalCedis, hydrated } = useCart();
  const [receipt, setReceipt] = useState<CheckoutSuccess | null>(null);

  function handleCheckoutSuccess(next: CheckoutSuccess) {
    setReceipt(next);
    clearCart();
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10 md:px-10 md:py-16">
      <h1
        className="text-[32px] font-extrabold tracking-tight text-[#141414] md:text-[40px]"
        style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
      >
        Your cart
      </h1>

      {receipt ? (
        <RidePaymentInstructions receipt={receipt} shopHref={shopHref} />
      ) : !hydrated ? (
        <p className="mt-8 text-sm text-[#141414]/45">Loading your cart…</p>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-[#141414]/55">Your cart is empty.</p>
          <Link
            href={shopHref}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg px-6 text-sm font-semibold text-white"
            style={{ backgroundColor: ORANGE }}
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-[#D9D6CE] border-b border-[#D9D6CE]">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-4 py-5">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#E8E6E1]">
                  {isImageSrc(item.image) ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      unoptimized
                      sizes="80px"
                      className="object-contain p-1.5"
                    />
                  ) : (
                    <MotorbikePlaceholder className="h-[70%] w-[80%]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="text-[16px] font-extrabold leading-snug text-[#141414]"
                    style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
                  >
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: ORANGE }}>
                    {formatCedis(item.priceCedis)}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-lg border border-[#D9D6CE] bg-[#FFFDFA]">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center text-[#141414]"
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
                        className="flex h-8 w-8 items-center justify-center text-[#141414]"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => removeItem(item.productId)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#141414]/40 transition-colors hover:bg-[#141414]/5 hover:text-[#141414]"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between text-[15px] font-bold text-[#141414]">
            <span>Total</span>
            <span>{formatCedis(totalCedis)}</span>
          </div>

          <RideCheckoutForm
            storeSlug={storeSlug}
            items={items}
            onSuccess={handleCheckoutSuccess}
          />
        </>
      )}
    </div>
  );
}
