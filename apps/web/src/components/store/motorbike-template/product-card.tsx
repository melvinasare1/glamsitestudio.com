"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ShoppingBag, Star } from "lucide-react";
import { MotorbikePlaceholder } from "@/components/store/motorbike-template/placeholders";
import { rideCartHrefFromPath } from "@/components/store/motorbike-template/demo-catalog";
import { useAddToCartFeedback } from "@/components/store/cart-feedback";
import { useCart } from "@/lib/cart-context";
import { formatCedis } from "@/lib/price";
import { swatchHex } from "@/lib/swatch";

const ORANGE = "#E8622C";

function lightSwatch(hex: string): boolean {
  const value = hex.trim().toLowerCase();
  return value === "#fff" || value === "#ffffff" || value === "#f4c430" || value === "#adb5bd";
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="mt-1.5 flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          fill={i < value ? "#E8B923" : "none"}
          color="#E8B923"
          strokeWidth={1.6}
        />
      ))}
    </div>
  );
}

export function RideProductCard({
  href,
  productId,
  name,
  priceCedis,
  image,
  colors,
  rating,
  titleAs: TitleTag = "h3",
}: {
  href: string;
  productId: string;
  name: string;
  priceCedis: number;
  image: string;
  colors: string[];
  rating?: number;
  titleAs?: "h2" | "h3";
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { addItem, hydrated } = useCart();
  const { added, notifyAdded } = useAddToCartFeedback();
  const swatches = colors.slice(0, 4).map(swatchHex);
  const cartHref = rideCartHrefFromPath(pathname);

  function addToCart(showFeedback = true) {
    if (!hydrated) return;
    addItem({
      productId,
      name,
      priceCedis,
      image,
      quantity: 1,
    });
    if (showFeedback) notifyAdded();
  }

  function buyNow() {
    addToCart(false);
    router.push(cartHref);
  }

  return (
    <article className="overflow-hidden rounded-[24px] border border-[#D9D6CE] bg-[#FFFDFA]">
      <div className="relative">
        <Link href={href} className="block">
          <div className="relative flex aspect-square items-center justify-center bg-[#E8E6E1]">
            {image ? (
              <div className="relative h-[85%] w-[85%]">
                <Image
                  src={image}
                  alt={name}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 38vw, 85vw"
                  className="object-contain"
                />
              </div>
            ) : (
              <MotorbikePlaceholder className="h-[70%] w-[80%]" />
            )}
          </div>
        </Link>
        <button
          type="button"
          aria-label={added ? `${name} added to cart` : `Add ${name} to cart`}
          onClick={() => addToCart()}
          disabled={!hydrated}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#FFFDFA] text-[#141414] shadow-[0_4px_12px_rgba(20,20,20,0.12)] transition-colors hover:bg-[#141414] hover:text-white disabled:cursor-wait disabled:opacity-60"
        >
          {added ? (
            <Check className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          ) : (
            <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
      <Link href={href} className="block px-4 pt-4">
        {swatches.length > 0 ? (
          <div className="flex gap-1.5">
            {swatches.map((hex, index) => (
              <span
                key={`${hex}-${index}`}
                className="h-3.5 w-3.5 rounded-full"
                style={{
                  backgroundColor: hex,
                  boxShadow: lightSwatch(hex) ? "inset 0 0 0 1px rgba(0,0,0,0.12)" : undefined,
                }}
              />
            ))}
          </div>
        ) : null}
        <TitleTag
          className="mt-3 text-[16px] font-extrabold text-[#141414]"
          style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
        >
          {name}
        </TitleTag>
        <p className="mt-1 text-[14px] text-[#141414]/55">{formatCedis(priceCedis)}</p>
        {rating ? <StarRating value={rating} /> : null}
      </Link>
      <div className="px-4 pb-5 pt-3">
        <button
          type="button"
          onClick={buyNow}
          disabled={!hydrated}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          style={{ backgroundColor: ORANGE }}
        >
          Buy
        </button>
      </div>
    </article>
  );
}
