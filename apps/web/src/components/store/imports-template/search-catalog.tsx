"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/store/imports-template/ProductCard";
import {
  applyCatalogFilters,
  filtersFromSearchParams,
  parseSearchSort,
  setRepeatParam,
  toggleNamedValue,
} from "@/components/store/catalog-search-filters";
import type { Product } from "@glamsite/shared/types";

export function ImportsSearchCatalog({
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
      <h1 className="text-2xl font-semibold tracking-tight text-[#1a1f2b] sm:text-3xl">Shop</h1>
      <p className="mt-2 text-sm text-[#66707e]">Browse this shop’s products.</p>

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
                    ? "rounded-full bg-[#1266b5] px-4 py-2 text-sm font-medium text-white"
                    : "rounded-full bg-[#e8f1fa] px-4 py-2 text-sm font-medium text-[#1266b5] hover:bg-[#1266b5]/15"
                }
              >
                {category}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-[#66707e]">
          {results.length} {results.length === 1 ? "product" : "products"}
        </p>
        <label className="flex items-center gap-2 text-sm text-[#66707e]">
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
            className="h-10 rounded-lg border border-[#e4e8ef] bg-white px-3 text-sm text-[#1a1f2b] outline-none"
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

export function ImportsSearchSkeleton() {
  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-hidden>
      <div className="h-8 w-40 animate-pulse rounded-lg bg-[#e4e8ef]" />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index} className="aspect-square animate-pulse rounded-lg bg-[#e8f1fa]" />
        ))}
      </ul>
    </div>
  );
}
