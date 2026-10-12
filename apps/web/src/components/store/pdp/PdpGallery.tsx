"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { Product } from "@glamsite/shared/types";

function GalleryThumbs({
  gallery,
  selected,
  onSelect,
  thumbClass,
  accent,
  objectFit,
  unoptimized,
  className,
}: {
  gallery: string[];
  selected: number;
  onSelect: (index: number) => void;
  thumbClass: string;
  accent: string;
  objectFit: "cover" | "contain";
  unoptimized: boolean;
  className: string;
}) {
  return (
    <div className={className}>
      {gallery.map((src, index) => {
        const active = index === selected;
        return (
          <button
            key={src}
            type="button"
            aria-label={`View image ${index + 1}`}
            aria-pressed={active}
            onClick={() => onSelect(index)}
            className={thumbClass}
            style={{ boxShadow: active ? `inset 0 0 0 2px ${accent}` : undefined }}
          >
            <Image
              src={src}
              alt=""
              fill
              unoptimized={unoptimized}
              sizes="80px"
              className={objectFit === "contain" ? "object-contain p-1" : "object-cover"}
            />
          </button>
        );
      })}
    </div>
  );
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const src of urls) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    result.push(src);
  }
  return result;
}

function imagesForValue(product: Product, value: string): string[] {
  const key = value.trim().toLowerCase();
  if (!key) return [];
  for (const variant of product.variants ?? []) {
    const byValue = variant.imagesByValue;
    if (byValue) {
      for (const [label, list] of Object.entries(byValue)) {
        if (label.toLowerCase() === key && list.length) return uniqueUrls(list);
      }
    }
    const variantColor = (variant.color ?? "").trim().toLowerCase();
    const variantSize = (variant.size ?? "").trim().toLowerCase();
    if ((variantColor === key || variantSize === key) && variant.images.length) {
      return uniqueUrls(variant.images);
    }
  }
  return [];
}

/** Variant photos for the current color/size, falling back to the product gallery. */
export function imagesForSelection(product: Product, color?: string, size?: string): string[] {
  const colorImages = imagesForValue(product, color ?? "");
  if (colorImages.length > 0) return colorImages;
  const sizeImages = imagesForValue(product, size ?? "");
  if (sizeImages.length > 0) return sizeImages;
  return uniqueUrls(product.images);
}

export function PdpGallery({
  images,
  alt,
  accent,
  aspectClass,
  frameClass,
  thumbClass,
  objectFit = "cover",
  unoptimized = false,
}: {
  images: string[];
  alt: string;
  accent: string;
  aspectClass: string;
  frameClass: string;
  thumbClass: string;
  objectFit?: "cover" | "contain";
  unoptimized?: boolean;
}) {
  const gallery = uniqueUrls(images);
  const [selected, setSelected] = useState(0);
  const galleryKey = gallery.join("|");

  useEffect(() => {
    setSelected(0);
  }, [galleryKey]);

  const main = gallery[Math.min(selected, Math.max(gallery.length - 1, 0))] ?? "";

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {gallery.length > 1 ? (
        <GalleryThumbs
          gallery={gallery}
          selected={selected}
          onSelect={setSelected}
          thumbClass={thumbClass}
          accent={accent}
          objectFit={objectFit}
          unoptimized={unoptimized}
          className="hidden max-h-[560px] shrink-0 flex-col gap-3 overflow-y-auto pr-1 lg:flex"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className={`relative ${aspectClass} overflow-hidden ${frameClass}`}>
          {main ? (
            <Image
              src={main}
              alt={alt}
              fill
              unoptimized={unoptimized}
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className={objectFit === "contain" ? "object-contain p-[8%]" : "object-cover"}
            />
          ) : null}
        </div>
        {gallery.length > 1 ? (
          <div className="mt-4 flex items-center gap-3 lg:hidden">
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => setSelected((current) => (current - 1 + gallery.length) % gallery.length)}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-black/15 bg-white"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <GalleryThumbs
              gallery={gallery}
              selected={selected}
              onSelect={setSelected}
              thumbClass={thumbClass}
              accent={accent}
              objectFit={objectFit}
              unoptimized={unoptimized}
              className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1"
            />
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setSelected((current) => (current + 1) % gallery.length)}
              className="flex h-9 w-9 shrink-0 items-center justify-center bg-black text-white"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PdpQuantity({
  value,
  onChange,
  wrapClass,
}: {
  value: number;
  onChange: (next: number) => void;
  wrapClass: string;
}) {
  return (
    <div className={wrapClass}>
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-12 w-12 items-center justify-center"
      >
        <Minus className="h-4 w-4" strokeWidth={2} />
      </button>
      <span className="min-w-[2ch] text-center text-[15px] font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(99, value + 1))}
        className="flex h-12 w-12 items-center justify-center"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

export function productFeatures(product: { features?: string[] }): string[] {
  return (product.features ?? []).map((item) => item.trim()).filter(Boolean);
}
