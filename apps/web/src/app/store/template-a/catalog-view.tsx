"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ChevronUp, SlidersHorizontal } from "lucide-react";
import { AddToCartIconButton, BuyNowButton } from "@/components/store/template-a/AddToBagButton";
import { STYLECO_CATEGORIES } from "@/components/store/template-a/categories";
import { ShirtPlaceholder } from "@/components/store/template-a/ShirtPlaceholder";
import {
  applyCatalogFilters,
  filtersFromSearchParams,
  parsePriceBound,
  setRepeatParam,
  toggleNamedValue,
} from "@/components/store/catalog-search-filters";
import { formatCedis } from "@/lib/price";
import { fillFromId, swatchHex } from "@/lib/swatch";
import type { Product } from "@glamsite/shared/types";

const ACCENT = "#FF7A1A";

const FILTER_COLORS = [
  { name: "Green", hex: "#2F9E44" },
  { name: "Black", hex: "#111111" },
  { name: "Purple", hex: "#7B2CBF" },
  { name: "Red", hex: "#E03131" },
  { name: "Blue", hex: "#1C7ED6" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Brown", hex: "#C08A4D" },
  { name: "Pink", hex: "#F783AC" },
  { name: "Yellow", hex: "#F4C430" },
  { name: "Sky", hex: "#74C0FC" },
  { name: "Gray", hex: "#ADB5BD" },
  { name: "Crimson", hex: "#C92A2A" },
] as const;

function productSwatch(product: Product): string {
  const firstColor = product.colors?.[0];
  if (firstColor) return swatchHex(firstColor);
  return fillFromId(product.id);
}

function catalogHeading(categories: string[]): string {
  if (categories.length === 1) return categories[0] ?? "All Products";
  return "All Products";
}

export function TemplateACatalogView({
  products,
  productBase,
}: {
  products: Product[];
  productBase: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = filtersFromSearchParams(searchParams);
  const urlMin = searchParams.get("min") ?? "";
  const urlMax = searchParams.get("max") ?? "";
  const [minDraft, setMinDraft] = useState(urlMin);
  const [maxDraft, setMaxDraft] = useState(urlMax);

  useEffect(() => {
    setMinDraft(urlMin);
  }, [urlMin]);

  useEffect(() => {
    setMaxDraft(urlMax);
  }, [urlMax]);

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const selectCategory = (value: string) => {
    replaceParams((params) => {
      const already = filters.categories.some((item) => item.toLowerCase() === value.toLowerCase());
      setRepeatParam(params, "category", already ? [] : [value]);
    });
  };

  const toggleColor = (value: string) => {
    replaceParams((params) => {
      setRepeatParam(params, "color", toggleNamedValue(filters.colors, value));
    });
  };

  const commitPrice = () => {
    replaceParams((params) => {
      const min = parsePriceBound(minDraft);
      const max = parsePriceBound(maxDraft);
      if (min == null) params.delete("min");
      else params.set("min", String(Math.round(min)));
      if (max == null) params.delete("max");
      else params.set("max", String(Math.round(max)));
    });
  };

  const results = useMemo(() => applyCatalogFilters(products, filters), [filters, products]);
  const heading = catalogHeading(filters.categories);
  const catalogMax = Math.max(0, ...products.map((product) => product.priceCedis));
  const rangeMax = Math.max(catalogMax, filters.maxPrice ?? 0, 100);
  const minBound = filters.minPrice ?? 0;
  const maxBound = filters.maxPrice ?? rangeMax;
  const barLeft = rangeMax > 0 ? `${(minBound / rangeMax) * 100}%` : "0%";
  const barRight = rangeMax > 0 ? `${100 - (maxBound / rangeMax) * 100}%` : "0%";

  return (
    <div id="catalog" className="mx-auto flex max-w-[1400px] flex-col md:flex-row md:items-start">
      <aside className="w-full shrink-0 border-black/10 px-5 py-8 md:w-[280px] md:border-r md:px-8 lg:w-[300px]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Filter</h2>
          <SlidersHorizontal className="h-4 w-4 text-black" strokeWidth={2} />
        </div>

        <ul className="mt-5 space-y-0.5">
          {STYLECO_CATEGORIES.map((label) => {
            const selected = filters.categories.some((item) => item.toLowerCase() === label.toLowerCase());
            return (
              <li key={label}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectCategory(label)}
                  className={`flex w-full items-center justify-between py-1.5 text-left text-[14px] transition-opacity hover:opacity-60 ${
                    selected ? "font-semibold" : "text-black"
                  }`}
                >
                  {label}
                  <ChevronRight className="h-4 w-4 text-black/30" strokeWidth={1.75} />
                </button>
              </li>
            );
          })}
        </ul>

        <details open className="group mt-4 border-t border-black/10 pt-5">
          <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
            <span className="text-[15px] font-bold">Price</span>
            <ChevronUp
              className="h-4 w-4 rotate-180 text-black/50 transition-transform group-open:rotate-0"
              strokeWidth={2}
            />
          </summary>
          <div className="mt-5">
            <div className="relative h-1.5 rounded-full bg-[#E5E5E5]" aria-hidden>
              <div
                className="absolute inset-y-0 rounded-full"
                style={{ left: barLeft, right: barRight, backgroundColor: ACCENT }}
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <label className="block w-full text-center text-[11px] text-black/45">
                Min (GHS)
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={minDraft}
                  onChange={(event) => setMinDraft(event.target.value)}
                  onBlur={commitPrice}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  placeholder="0"
                  aria-label="Minimum price"
                  className="mt-1 h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-center text-sm text-black/70 outline-none"
                />
              </label>
              <label className="block w-full text-center text-[11px] text-black/45">
                Max (GHS)
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={maxDraft}
                  onChange={(event) => setMaxDraft(event.target.value)}
                  onBlur={commitPrice}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  placeholder="Any"
                  aria-label="Maximum price"
                  className="mt-1 h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-center text-sm text-black/70 outline-none"
                />
              </label>
            </div>
          </div>
        </details>

        <details open className="group mt-5 border-t border-black/10 pt-5">
          <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
            <span className="text-[15px] font-bold">Colors</span>
            <ChevronUp
              className="h-4 w-4 rotate-180 text-black/50 transition-transform group-open:rotate-0"
              strokeWidth={2}
            />
          </summary>
          <ul className="mt-4 grid grid-cols-4 gap-x-3 gap-y-3.5">
            {FILTER_COLORS.map((color) => {
              const selected = filters.colors.some((item) => item.toLowerCase() === color.name.toLowerCase());
              return (
                <li key={color.name} className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={`Filter by ${color.name}`}
                    onClick={() => toggleColor(color.name)}
                    className="h-8 w-8 rounded-md"
                    style={{
                      backgroundColor: color.hex,
                      boxShadow: selected
                        ? `0 0 0 2px ${ACCENT}`
                        : color.hex === "#FFFFFF"
                          ? "inset 0 0 0 1px rgba(0,0,0,0.12)"
                          : undefined,
                    }}
                  />
                  <span className="text-[11px] text-black/55">{color.name}</span>
                </li>
              );
            })}
          </ul>
        </details>
      </aside>

      <section className="min-w-0 flex-1 px-5 py-8 md:px-8 lg:px-10">
        <h1 className="text-[15px] font-semibold tracking-tight text-black/80">{heading}</h1>

        {products.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-black/15 px-6 py-16 text-center">
            <p className="text-lg font-bold">No products yet</p>
            <p className="mt-2 text-sm text-black/50">
              Products will appear here on a client site copied from this template.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-black/15 px-6 py-16 text-center">
            <p className="text-lg font-bold">No products match your filters</p>
            <p className="mt-2 text-sm text-black/50">Try another category, color, or price range.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((product) => {
              const photo = product.images[0];
              const swatch = productSwatch(product);
              return (
                <article key={product.id} className="group">
                  <div className="relative">
                    <Link
                      href={`${productBase}/product/${product.id}`}
                      className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl bg-[#EDEDED]"
                    >
                      {photo ? (
                        <Image
                          src={photo}
                          alt={product.name}
                          fill
                          sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 90vw"
                          className="object-cover"
                        />
                      ) : (
                        <ShirtPlaceholder fill={swatch} />
                      )}
                    </Link>
                    <AddToCartIconButton
                      productId={product.id}
                      name={product.name}
                      priceCedis={product.priceCedis}
                      image={photo || swatch}
                    />
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <Link href={`${productBase}/product/${product.id}`} className="min-w-0">
                      <p className="text-[15px] font-bold leading-snug">{product.name}</p>
                      <p className="mt-1 text-[14px] text-black/80">{formatCedis(product.priceCedis)}</p>
                    </Link>
                    <BuyNowButton
                      productId={product.id}
                      name={product.name}
                      priceCedis={product.priceCedis}
                      image={photo || swatch}
                      cartHref={`${productBase}/cart`}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export function TemplateACatalogSkeleton() {
  return (
    <div id="catalog" className="mx-auto flex max-w-[1400px] flex-col md:flex-row">
      <div className="h-64 w-full animate-pulse bg-black/5 md:w-[280px]" />
      <div className="min-w-0 flex-1 px-5 py-8 md:px-8">
        <div className="h-5 w-28 animate-pulse rounded bg-black/10" />
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-black/10" />
          ))}
        </div>
      </div>
    </div>
  );
}
