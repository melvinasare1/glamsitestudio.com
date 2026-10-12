"use client";

import { useState, type ReactNode } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { rideCartHrefFromPath } from "@/components/store/motorbike-template/demo-catalog";
import { MotorbikePlaceholder } from "@/components/store/motorbike-template/placeholders";
import { PdpFaqs } from "@/components/store/pdp/PdpFaqs";
import { PdpComparePrice, PdpFeaturesList, PdpShortDescription } from "@/components/store/pdp/PdpFeaturesList";
import { PdpGallery, PdpQuantity, productFeatures } from "@/components/store/pdp/PdpGallery";
import { PdpReviews } from "@/components/store/pdp/PdpReviews";
import { RIDE_CHROME } from "@/components/store/pdp/chrome";
import { useAddToCartFeedback } from "@/components/store/cart-feedback";
import { useCart } from "@/lib/cart-context";
import type { Product, StoreFaq } from "@glamsite/shared/types";

const ORANGE = RIDE_CHROME.accent;

export function RideProductDetail({
  product,
  faqs,
  children,
}: {
  product: Product;
  faqs: StoreFaq[];
  children?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { addItem, hydrated } = useCart();
  const { added, notifyAdded } = useAddToCartFeedback();
  const [quantity, setQuantity] = useState(1);
  const features = productFeatures(product);
  const photos = product.images.filter(Boolean);
  const photo = photos[0] ?? "";

  function handleAdd(showFeedback = true) {
    if (!hydrated) return;
    const qty = Math.min(99, Math.max(1, Math.floor(quantity) || 1));
    addItem({
      productId: product.id,
      name: product.name,
      priceCedis: product.priceCedis,
      image: photo,
      quantity: qty,
    });
    if (showFeedback) notifyAdded();
  }

  function handleBuy() {
    handleAdd(false);
    router.push(rideCartHrefFromPath(pathname));
  }

  return (
    <div>
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        {photos.length > 0 ? (
          <PdpGallery
            images={photos}
            alt={product.name}
            accent={ORANGE}
            aspectClass="aspect-square"
            frameClass="rounded-[24px] border border-[#D9D6CE] bg-[#E8E6E1]"
            thumbClass="relative flex aspect-square w-16 shrink-0 overflow-hidden rounded-lg border border-[#D9D6CE] bg-[#E8E6E1]"
            objectFit="contain"
            unoptimized
          />
        ) : (
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[24px] border border-[#D9D6CE] bg-[#E8E6E1]">
            <MotorbikePlaceholder className="h-[70%] w-[80%]" />
          </div>
        )}

        <div className="lg:pt-4">
          {product.category ? (
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>
              {product.category}
            </p>
          ) : null}
          <h1
            className="mt-2 text-[32px] font-extrabold leading-tight tracking-tight text-[#141414] md:text-[40px]"
            style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
          >
            {product.name}
          </h1>
          <PdpComparePrice
            priceCedis={product.priceCedis}
            compareAtPriceCedis={product.compareAtPriceCedis}
            wrapClassName="mt-3 flex flex-wrap items-baseline gap-3"
            priceClassName="text-[22px] font-semibold"
            compareClassName="text-[16px] font-medium text-[#141414]/35 line-through"
            priceStyle={{ color: ORANGE }}
          />
          <PdpShortDescription
            text={product.shortDescription}
            className="mt-4 max-w-md text-[15px] leading-relaxed text-[#141414]/70"
          />
          {product.description ? (
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#141414]/60">{product.description}</p>
          ) : null}

          <PdpFeaturesList
            features={features}
            accent={ORANGE}
            itemClassName="flex items-start gap-2 text-[14px] text-[#141414]/75"
          />

          <div className="mt-6">
            <p className="text-sm font-semibold text-[#141414]">Quantity</p>
            <PdpQuantity
              value={quantity}
              onChange={setQuantity}
              wrapClass="mt-3 inline-flex h-12 items-center rounded-lg border border-[#141414] bg-[#FFFDFA]"
            />
          </div>

          <div className="mt-8 flex w-full items-center gap-2 sm:w-auto">
            <button
              type="button"
              aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`}
              onClick={() => handleAdd()}
              disabled={!hydrated}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#141414] text-[#141414] transition-colors hover:bg-[#141414] hover:text-white disabled:cursor-wait disabled:opacity-60"
            >
              {added ? (
                <Check className="h-5 w-5" strokeWidth={2.2} aria-hidden />
              ) : (
                <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
              )}
            </button>
            <button
              type="button"
              onClick={handleBuy}
              disabled={!hydrated}
              className="inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg px-7 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 sm:min-w-[220px]"
              style={{ backgroundColor: ORANGE }}
            >
              Buy
            </button>
          </div>
        </div>
      </div>

      {children}
      <PdpReviews productId={product.id} chrome={RIDE_CHROME} />
      <PdpFaqs faqs={faqs} chrome={RIDE_CHROME} />
    </div>
  );
}
