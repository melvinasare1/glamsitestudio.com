"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PdpFaqs } from "@/components/store/pdp/PdpFaqs";
import { PdpComparePrice, PdpFeaturesList, PdpShortDescription } from "@/components/store/pdp/PdpFeaturesList";
import { imagesForSelection, PdpGallery, PdpQuantity, productFeatures } from "@/components/store/pdp/PdpGallery";
import { PdpReviews } from "@/components/store/pdp/PdpReviews";
import { PdpVariantSelectors } from "@/components/store/pdp/PdpVariantSelectors";
import { useProductVariantSelection } from "@/components/store/pdp/use-product-variant-selection";
import { IMPORTS_CHROME } from "@/components/store/pdp/chrome";
import { useAddToCartFeedback } from "@/components/store/cart-feedback";
import { useCart } from "@/lib/cart-context";
import { fillFromId, swatchHex } from "@/lib/swatch";
import { sellerSlugFromPath, storefrontBase } from "@/lib/store-path";
import type { Product, StoreFaq } from "@glamsite/shared/types";

const ACCENT = IMPORTS_CHROME.accent;

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
  const cartHref = `${storefrontBase("imports-template", sellerSlugFromPath(pathname, "imports-template"))}/cart`;
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
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <PdpGallery
          images={imagesForSelection(product, galleryColor, gallerySize)}
          alt={product.name}
          accent={ACCENT}
          aspectClass="aspect-square"
          frameClass="rounded-lg bg-[#e8f1fa]"
          thumbClass="relative flex aspect-square w-16 shrink-0 overflow-hidden rounded-md bg-[#e8f1fa] sm:w-20"
        />
        <div>
          {product.category ? (
            <p className="text-[0.7rem] font-medium tracking-[0.14em] text-[#66707e] uppercase">
              {product.category}
            </p>
          ) : null}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a1f2b] sm:text-3xl">
            {product.name}
          </h1>
          <PdpShortDescription
            text={product.shortDescription}
            className="mt-4 max-w-xl text-[#66707e]"
          />
          {product.description ? (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#66707e]">{product.description}</p>
          ) : null}

          <PdpComparePrice
            priceCedis={product.priceCedis}
            compareAtPriceCedis={product.compareAtPriceCedis}
            wrapClassName="mt-4 flex flex-wrap items-baseline gap-3"
            priceClassName="text-2xl font-bold text-[#1266b5]"
            compareClassName="text-base text-[#66707e] line-through"
          />

          <PdpFeaturesList
            features={features}
            accent={ACCENT}
            itemClassName="flex items-start gap-2 text-sm text-[#1a1f2b]"
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
            colorLabel="Colour"
            labelClassName="text-sm font-medium text-[#1a1f2b]"
            sizeSectionClassName="mt-6"
            colorSectionClassName="mt-4"
            sizeButtonClassName={(selected) =>
              selected
                ? "rounded-lg border border-[#1266b5] bg-[#1266b5] px-3 py-2 text-sm font-medium text-white"
                : "rounded-lg border border-[#e4e8ef] bg-white px-3 py-2 text-sm font-medium text-[#1a1f2b] hover:border-[#1266b5]/40"
            }
            colorMode="swatch"
            colorWrapClassName="mt-3 flex items-center gap-2.5"
            swatchSelectedRing="0 0 0 2px #1266b5"
          />

          <div className="mt-6">
            <p className="text-sm font-medium text-[#1a1f2b]">Quantity</p>
            <PdpQuantity
              value={quantity}
              onChange={setQuantity}
              wrapClass="mt-2 inline-flex items-center rounded-lg border border-[#e4e8ef] bg-white"
            />
          </div>

          <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:w-auto">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-[#e4e8ef] bg-white px-6 text-sm font-medium text-[#1a1f2b] transition-colors hover:border-[#1266b5]/40"
            >
              {added ? "Added" : "Add to cart"}
            </button>
            <button
              type="button"
              onClick={handleBuy}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-[#1266b5] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0d4c88]"
            >
              Buy now
            </button>
          </div>
        </div>
      </div>

      {children}
      <PdpReviews productId={product.id} chrome={IMPORTS_CHROME} />
      <PdpFaqs faqs={faqs} chrome={IMPORTS_CHROME} />
    </div>
  );
}
