"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/store/hair-beauty-template/ProductCard";
import {
  applyCatalogFilters,
  filtersFromSearchParams,
  parseSearchSort,
  setRepeatParam,
  toggleNamedValue,
} from "@/components/store/catalog-search-filters";
import type { Product } from "@glamsite/shared/types";

export function HairSearchCatalog({
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

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const product of products) {
      const name = product.category.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(name);
    }
    return names;
  }, [products]);

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const results = useMemo(() => applyCatalogFilters(products, filters), [filters, products]);

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <h1
        className="text-2xl font-medium tracking-tight text-[#4f4a3d] sm:text-3xl"
        style={{ fontFamily: "var(--font-hair-display), ui-serif, Georgia" }}
      >
        Shop
      </h1>
      <p className="mt-2 text-sm text-[#4f4a3d]/55">Browse wigs, bundles, and extensions.</p>

      {categories.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((category) => {
            const selected = filters.categories.some(
              (item) => item.toLowerCase() === category.toLowerCase()
            );
            return (
              <button
                key={category}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  replaceParams((params) => {
                    setRepeatParam(params, "category", toggleNamedValue(filters.categories, category));
                  })
                }
                className={
                  selected
                    ? "rounded-full bg-[#8a8165] px-4 py-2 text-sm font-medium text-[#f7f1df]"
                    : "rounded-full border border-[#d9cfc3] bg-white px-4 py-2 text-sm font-medium text-[#4f4a3d] hover:border-[#c4b896]"
                }
              >
                {category}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-[#4f4a3d]/55">
          {results.length} {results.length === 1 ? "product" : "products"}
        </p>
        <label className="flex items-center gap-2 text-sm text-[#4f4a3d]/55">
          Sort
          <select
            value={filters.sort}
            onChange={(event) => {
              const next = parseSearchSort(event.target.value);
              replaceParams((params) => {
                if (next === "newest") params.delete("sort");
                else params.set("sort", next);
              });
            }}
            className="h-10 rounded-full border border-[#d9cfc3] bg-white px-3 text-sm text-[#4f4a3d] outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="mt-6">
        <ProductGrid
          products={results}
          productBase={productBase}
          emptyTitle={products.length === 0 ? "No products listed yet" : "No products match your filters"}
          emptyDescription={
            products.length === 0
              ? "Active products from this shop will show up here."
              : "Try another keyword or clear a category."
          }
        />
      </div>
    </div>
  );
}

export function HairSearchSkeleton() {
  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-hidden>
      <div className="h-8 w-40 animate-pulse rounded-full bg-[#d9cfc3]/60" />
      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index} className="aspect-[3/4] animate-pulse bg-[#efe6db]" />
        ))}
      </ul>
    </div>
  );
}
