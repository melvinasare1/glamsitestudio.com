"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { ShirtPlaceholder } from "@/components/store/template-a/ShirtPlaceholder";
import { ProductFaqs } from "@/components/store/template-a/ProductFaqs";
import { ProductReviews } from "@/components/store/template-a/ProductReviews";
import { PdpComparePrice, PdpFeaturesList, PdpShortDescription } from "@/components/store/pdp/PdpFeaturesList";
import { imagesForSelection } from "@/components/store/pdp/PdpGallery";
import { PdpVariantSelectors } from "@/components/store/pdp/PdpVariantSelectors";
import { useProductVariantSelection } from "@/components/store/pdp/use-product-variant-selection";
import { useAddToCartFeedback } from "@/components/store/cart-feedback";
import { useCart } from "@/lib/cart-context";
import { fillFromId, swatchHex } from "@/lib/swatch";
import { sellerSlugFromPath, storefrontBase } from "@/lib/store-path";
import type { Product, StoreFaq } from "@glamsite/shared/types";

const ACCENT = "#FF7A1A";

type GalleryItem =
  | { kind: "image"; src: string }
  | { kind: "swatch"; fill: string };

function galleryFor(product: Product, color: string, size: string): GalleryItem[] {
  const urls = imagesForSelection(product, color, size);
  if (urls.length > 0) {
    return urls.map((src) => ({ kind: "image" as const, src }));
  }
  if (product.colors && product.colors.length > 0) {
    return product.colors.slice(0, 4).map((item) => ({
      kind: "swatch" as const,
      fill: swatchHex(item),
    }));
  }
  return [{ kind: "swatch", fill: fillFromId(product.id) }];
}

function GalleryThumbs({
  gallery,
  selectedImage,
  onSelect,
  className,
}: {
  gallery: GalleryItem[];
  selectedImage: number;
  onSelect: (index: number) => void;
  className: string;
}) {
  return (
    <div className={className}>
      {gallery.map((item, index) => {
        const selected = index === selectedImage;
        return (
          <button
            key={item.kind === "image" ? item.src : `${item.fill}-${index}`}
            type="button"
            aria-label={`View image ${index + 1}`}
            aria-pressed={selected}
            onClick={() => onSelect(index)}
            className="relative flex aspect-square w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EDEDED] md:w-20"
            style={{
              boxShadow: selected ? `inset 0 0 0 2px ${ACCENT}` : undefined,
            }}
          >
            {item.kind === "image" ? (
              <Image src={item.src} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <ShirtPlaceholder fill={item.fill} className="h-[72%] w-[72%]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

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
  const cartHref = `${storefrontBase("template-a", sellerSlugFromPath(pathname, "template-a"))}/cart`;
  const features = (product.features ?? []).map((item) => item.trim()).filter(Boolean);
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

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const gallery = useMemo(
    () => galleryFor(product, galleryColor ?? "", gallerySize ?? ""),
    [product, galleryColor, gallerySize]
  );
  const galleryKey = gallery
    .map((item) => (item.kind === "image" ? item.src : item.fill))
    .join("|");

  useEffect(() => {
    setSelectedImage(0);
  }, [galleryKey]);

  const main = gallery[Math.min(selectedImage, Math.max(gallery.length - 1, 0))] ?? gallery[0];

  function addToBag() {
    const qty = Math.min(99, Math.max(1, Math.floor(quantity) || 1));
    const color = selection.color;
    const cartImage =
      main?.kind === "image"
        ? main.src
        : color
          ? swatchHex(color)
          : fillFromId(product.id);

    addItem({
      productId: lineId,
      name: cartName,
      priceCedis: product.priceCedis,
      image: cartImage,
      size: selection.size,
      color: selection.color,
      selectedVariants: selection.selectedVariants,
      quantity: qty,
    });
  }

  function handleAdd() {
    addToBag();
    notifyAdded();
  }

  function handleBuy() {
    addToBag();
    router.push(cartHref);
  }

  return (
    <div>
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col gap-4 lg:flex-row">
        {gallery.length > 1 ? (
          <GalleryThumbs
            gallery={gallery}
            selectedImage={selectedImage}
            onSelect={setSelectedImage}
            className="hidden max-h-[560px] shrink-0 flex-col gap-3 overflow-y-auto pr-1 lg:flex"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="relative flex aspect-[3/4] max-h-[560px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#EDEDED]">
            {main?.kind === "image" ? (
              <Image
                src={main.src}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
                priority
              />
            ) : (
              <ShirtPlaceholder
                fill={main?.kind === "swatch" ? main.fill : fillFromId(product.id)}
                className="h-[72%] w-[72%]"
              />
            )}
          </div>

          {gallery.length > 1 ? (
            <div className="mt-4 flex items-center gap-3 lg:hidden">
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => setSelectedImage((current) => (current - 1 + gallery.length) % gallery.length)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <GalleryThumbs
                gallery={gallery}
                selectedImage={selectedImage}
                onSelect={setSelectedImage}
                className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1"
              />
              <button
                type="button"
                aria-label="Next image"
                onClick={() => setSelectedImage((current) => (current + 1) % gallery.length)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="lg:pt-2">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight md:text-[32px]">
          {product.name}
        </h1>
        <PdpShortDescription
          text={product.shortDescription}
          className="mt-3 text-[14px] leading-relaxed text-black/55"
        />
        {product.description ? (
          <p className="mt-3 text-[14px] leading-relaxed text-black/45">{product.description}</p>
        ) : null}

        <PdpFeaturesList
          features={features}
          accent={ACCENT}
          itemClassName="flex items-start gap-2 text-[14px] text-black/70"
        />

        <PdpComparePrice
          priceCedis={product.priceCedis}
          compareAtPriceCedis={product.compareAtPriceCedis}
          wrapClassName="mt-5 flex flex-wrap items-baseline gap-3"
          priceClassName="text-[36px] font-extrabold leading-none"
          compareClassName="text-[20px] font-medium text-black/35 line-through"
          priceStyle={{ color: ACCENT }}
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
          sizeLabel="Select Size"
          colorLabel="Colors Available"
          labelClassName="text-[15px] font-bold"
          sizeSectionClassName="mt-8"
          colorSectionClassName="mt-7"
          sizeOuterClassName="mt-3 flex items-center gap-3"
          sizeRowClassName="flex min-w-0 flex-1 flex-wrap gap-2"
          sizeButtonClassName={(selected) =>
            selected
              ? "h-10 min-w-[44px] rounded-lg px-3.5 text-sm font-semibold text-white"
              : "h-10 min-w-[44px] rounded-lg border border-black/15 bg-white px-3.5 text-sm font-medium text-black"
          }
          sizeButtonStyle={(selected) => (selected ? { backgroundColor: ACCENT } : undefined)}
          sizeExtra={
            <a href="#" className="shrink-0 text-[13px] font-medium text-black/55 underline underline-offset-2">
              Size Guide
            </a>
          }
          colorMode="swatch"
          colorWrapClassName="mt-3 flex items-center gap-3"
          swatchButtonClassName="flex h-9 w-9 items-center justify-center rounded-full"
          swatchDotClassName="h-7 w-7 rounded-full"
          swatchSelectedRing="0 0 0 1.5px #111"
          swatchLightBorder
        />

        <div className="mt-8">
          <p className="text-[15px] font-bold">Quantity</p>
          <div className="mt-3 inline-flex h-12 items-center rounded-full border border-black/15 bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="flex h-12 w-12 items-center justify-center text-black/70 hover:text-black"
            >
              <Minus className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="min-w-[2ch] text-center text-[15px] font-semibold tabular-nums">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((current) => Math.min(99, current + 1))}
              className="flex h-12 w-12 items-center justify-center text-black/70 hover:text-black"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="mt-10 flex gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-black/15 bg-white text-[15px] font-semibold text-black transition hover:bg-black/5"
          >
            {added ? "Added" : "Add to cart"}
          </button>
          <button
            type="button"
            onClick={handleBuy}
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-black text-[15px] font-semibold text-white transition hover:bg-black/90"
          >
            Buy now
          </button>
        </div>
      </div>
      </div>

      {children}
      <ProductReviews productId={product.id} />
      <ProductFaqs faqs={faqs} />
    </div>
  );
}
