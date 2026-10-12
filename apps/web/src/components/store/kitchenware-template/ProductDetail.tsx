"use client";

import { useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PdpFaqs } from "@/components/store/pdp/PdpFaqs";
import { PdpComparePrice, PdpFeaturesList, PdpShortDescription } from "@/components/store/pdp/PdpFeaturesList";
import { imagesForSelection, PdpGallery, PdpQuantity, productFeatures } from "@/components/store/pdp/PdpGallery";
import { PdpReviews } from "@/components/store/pdp/PdpReviews";
import { PdpVariantSelectors } from "@/components/store/pdp/PdpVariantSelectors";
import { useProductVariantSelection } from "@/components/store/pdp/use-product-variant-selection";
import { HOMEDINE_CHROME } from "@/components/store/pdp/chrome";
import { useAddToCartFeedback } from "@/components/store/cart-feedback";
import { useCart } from "@/lib/cart-context";
import { fillFromId, swatchHex } from "@/lib/swatch";
import { sellerSlugFromPath, storefrontBase } from "@/lib/store-path";
import type { Product, StoreFaq } from "@glamsite/shared/types";

const ACCENT = HOMEDINE_CHROME.accent;

export function ProductDetail({
  product,
  faqs,
  children,
}: {
  product: Product;
  faqs: StoreFaq[];
  children?: ReactNode;
}) {
  const { addItem } = useCart();
  const { added, notifyAdded } = useAddToCartFeedback();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const cartHref = `${storefrontBase("kitchenware-template", sellerSlugFromPath(pathname, "kitchenware-template"))}/cart`;
  const features = productFeatures(product);
  const {
    sizes,
    colors,
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    selectedVariants,
    onSelectVariant,
    selection,
    lineId,
    cartName,
    galleryColor,
    gallerySize,
  } = useProductVariantSelection(product);
  const [quantity, setQuantity] = useState(1);

  function addToBag() {
    const qty = Math.min(99, Math.max(1, Math.floor(quantity) || 1));
    const photo = imagesForSelection(product, galleryColor, gallerySize)[0];
    const color = selection.color;

    addItem({
      productId: lineId,
      name: cartName,
      priceCedis: product.priceCedis,
      image: photo || (color ? swatchHex(color) : fillFromId(product.id)),
      size: selection.size,
      color: selection.color,
      selectedVariants: selection.selectedVariants,
      quantity: qty,
    });
  }

  function handleAdd() {
    if (added) return;
    addToBag();
    notifyAdded();
  }

  function handleBuy() {
    addToBag();
    router.push(cartHref);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-16">
      <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
        <PdpGallery
          images={imagesForSelection(product, galleryColor, gallerySize)}
          alt={product.name}
          accent={ACCENT}
          aspectClass="aspect-[4/5]"
          frameClass="rounded-2xl bg-[#EDE8DC]"
          thumbClass="relative flex aspect-square w-16 shrink-0 overflow-hidden rounded-xl bg-[#EDE8DC]"
        />
        <div className="md:pt-6">
          <h1
            className="text-[32px] font-medium leading-tight text-[#2B4239] md:text-[40px]"
            style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
          >
            {product.name}
          </h1>
          <PdpShortDescription
            text={product.shortDescription}
            className="mt-3 max-w-md text-[14px] leading-relaxed text-[#2B4239]/65"
          />
          {product.description ? (
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-[#2B4239]/55">
              {product.description}
            </p>
          ) : null}

          <PdpFeaturesList
            features={features}
            accent={ACCENT}
            itemClassName="flex items-start gap-2 text-[14px] text-[#2B4239]/75"
          />

          <PdpComparePrice
            priceCedis={product.priceCedis}
            compareAtPriceCedis={product.compareAtPriceCedis}
            wrapClassName="mt-5 flex flex-wrap items-baseline gap-3"
            priceClassName="text-[22px] font-semibold text-[#2B4239]"
            compareClassName="text-[16px] font-medium text-[#2B4239]/40 line-through"
          />

          <PdpVariantSelectors
            sizes={sizes}
            colors={colors}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            onSelectSize={setSelectedSize}
            onSelectColor={setSelectedColor}
            variants={product.variants}
            selectedVariants={selectedVariants}
            onSelectVariant={onSelectVariant}
            sizeLabel="Size"
            colorLabel="Color"
            labelClassName="text-sm font-semibold text-[#2B4239]"
            sizeSectionClassName="mt-8"
            colorSectionClassName="mt-6"
            sizeButtonClassName={(selected) =>
              selected
                ? "h-10 min-w-[44px] rounded-full bg-[#2B4239] px-4 text-sm font-medium text-[#F5F1E4]"
                : "h-10 min-w-[44px] rounded-full border border-[#2B4239]/20 bg-white px-4 text-sm font-medium text-[#2B4239]"
            }
            colorMode="swatch"
            colorWrapClassName="mt-3 flex items-center gap-2.5"
            swatchSelectedRing="0 0 0 1.5px #2B4239"
          />

          <div className="mt-6">
            <p className="text-sm font-semibold text-[#2B4239]">Quantity</p>
            <PdpQuantity
              value={quantity}
              onChange={setQuantity}
              wrapClass="mt-3 inline-flex h-12 items-center rounded-full border border-[#2B4239]/20 bg-white"
            />
          </div>

          <div className="mt-10 flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-[#2B4239]/25 bg-white text-sm font-medium text-[#2B4239] transition hover:bg-[#F5F1E4]"
            >
              {added ? "Added" : "Add to cart"}
            </button>
            <button
              type="button"
              onClick={handleBuy}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-[#2B4239] text-sm font-medium text-[#F5F1E4] transition hover:opacity-90"
            >
              Buy now
            </button>
          </div>
        </div>
      </div>

      {children}
      <PdpReviews productId={product.id} chrome={HOMEDINE_CHROME} />
      <PdpFaqs faqs={faqs} chrome={HOMEDINE_CHROME} />
    </div>
  );
}
