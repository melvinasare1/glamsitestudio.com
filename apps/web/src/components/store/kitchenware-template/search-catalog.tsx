"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ProductCardActions } from "@/components/store/kitchenware-template/AddToCartButton";
import {
  parseCategoryParam,
  parsePriceBound,
  parseSearchSort,
  productMatchesCategory,
  SEARCH_CATEGORIES,
  type KitchenwareCatalogCard,
  type KitchenwareFilterFacets,
  type SearchSort,
} from "@/components/store/kitchenware-template/search-filters";
import { formatCedis } from "@/lib/price";

const FOREST = "#2B4239";
const CREAM = "#F5F1E4";

const SORT_OPTIONS: Array<{ value: SearchSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className="rounded-full border px-3.5 py-1.5 text-[12px] font-medium tracking-wide"
      style={
        selected
          ? { backgroundColor: FOREST, borderColor: FOREST, color: CREAM }
          : { borderColor: "rgba(43,66,57,0.2)", color: FOREST, backgroundColor: "transparent" }
      }
    >
      {label}
    </button>
  );
}

function setRepeatParam(params: URLSearchParams, key: string, values: string[]) {
  params.delete(key);
  for (const value of values) params.append(key, value);
}

function toggleNamedValue(current: string[], value: string): string[] {
  const key = value.toLowerCase();
  const exists = current.some((item) => item.toLowerCase() === key);
  return exists ? current.filter((item) => item.toLowerCase() !== key) : [...current, value];
}

export function KitchenwareSearchCatalog({
  products,
  facets,
  productBase,
}: {
  products: KitchenwareCatalogCard[];
  facets: KitchenwareFilterFacets;
  productBase: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCategories = parseCategoryParam(searchParams.getAll("category"));
  const sort = parseSearchSort(searchParams.get("sort") ?? undefined);
  const urlMin = searchParams.get("min") ?? "";
  const urlMax = searchParams.get("max") ?? "";
  const urlQuery = searchParams.get("q") ?? "";
  const [minDraft, setMinDraft] = useState(urlMin);
  const [maxDraft, setMaxDraft] = useState(urlMax);
  const [queryDraft, setQueryDraft] = useState(urlQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setMinDraft(urlMin);
  }, [urlMin]);

  useEffect(() => {
    setMaxDraft(urlMax);
  }, [urlMax]);

  useEffect(() => {
    setQueryDraft(urlQuery);
  }, [urlQuery]);

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const toggleCategory = (value: string) => {
    replaceParams((params) => {
      setRepeatParam(
        params,
        "category",
        toggleNamedValue(parseCategoryParam(params.getAll("category")), value)
      );
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

  const commitQuery = () => {
    replaceParams((params) => {
      const next = queryDraft.trim();
      if (!next) params.delete("q");
      else params.set("q", next);
    });
  };

  const setSort = (next: SearchSort) => {
    replaceParams((params) => {
      if (next === "newest") params.delete("sort");
      else params.set("sort", next);
    });
  };

  const clearFilters = () => {
    router.replace(pathname, { scroll: false });
    setMinDraft("");
    setMaxDraft("");
    setQueryDraft("");
  };

  const minPrice = parsePriceBound(urlMin);
  const maxPrice = parsePriceBound(urlMax);
  const hasFilters =
    selectedCategories.length > 0 ||
    urlQuery.trim().length > 0 ||
    minPrice != null ||
    maxPrice != null ||
    sort !== "newest";

  const categoryOptions = useMemo(() => {
    const known = SEARCH_CATEGORIES.map((item) => item.slug);
    const extras = facets.categories.filter(
      (name) => !known.some((slug) => slug.toLowerCase() === name.toLowerCase())
    );
    return [...SEARCH_CATEGORIES.map((item) => ({ slug: item.slug, label: item.label })), ...extras.map((name) => ({ slug: name, label: name }))];
  }, [facets.categories]);

  const results = useMemo(() => {
    const needle = urlQuery.trim().toLowerCase();
    const filtered = products.filter((product) => {
      if (needle) {
        const haystack = [product.name, product.description, product.category].join(" ").toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (selectedCategories.length > 0) {
        const matches = selectedCategories.some((slug) =>
          productMatchesCategory(product.category, slug)
        );
        if (!matches) return false;
      }
      if (minPrice != null && product.priceCedis < minPrice) return false;
      if (maxPrice != null && product.priceCedis > maxPrice) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "price-asc") return a.priceCedis - b.priceCedis;
      if (sort === "price-desc") return b.priceCedis - a.priceCedis;
      return b.createdAt - a.createdAt;
    });
  }, [maxPrice, minPrice, products, selectedCategories, sort, urlQuery]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-[36px] font-medium leading-none text-[#2B4239] md:text-[44px]"
            style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
          >
            Search
          </h1>
          <p className="mt-2 text-sm text-[#2B4239]/55">
            Browse drinkware, cookware, utensils, and serveware.
          </p>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="self-start text-sm font-medium text-[#2B4239]/60 underline-offset-4 hover:text-[#2B4239] hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
        <aside className="rounded-2xl border border-[#2B4239]/12 bg-[#EDF1EA]">
          <button
            type="button"
            className="flex w-full items-center justify-between px-6 py-4 text-left lg:hidden"
            aria-expanded={filtersOpen}
            aria-controls="kitchenware-search-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <span
              className="text-[15px] font-medium text-[#2B4239]"
              style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
            >
              Filter
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-[#2B4239] transition-transform ${
                filtersOpen ? "rotate-180" : ""
              }`}
              strokeWidth={1.8}
              aria-hidden
            />
          </button>
          <p
            className="hidden px-6 pt-6 text-[18px] font-medium text-[#2B4239] lg:block"
            style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
          >
            Filter
          </p>

          <div
            id="kitchenware-search-filters"
            className={`px-6 pb-6 ${filtersOpen ? "block" : "hidden"} lg:block`}
          >
            <label className="mt-2 block lg:mt-6">
              <span className="text-[13px] font-semibold text-[#2B4239]">Search</span>
              <input
                type="search"
                value={queryDraft}
                onChange={(event) => setQueryDraft(event.target.value)}
                onBlur={commitQuery}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                placeholder="Name or keyword"
                className="mt-2 w-full rounded-full border border-[#2B4239]/15 bg-white px-4 py-2 text-sm text-[#2B4239] outline-none focus:border-[#2B4239]/40"
              />
            </label>

            <fieldset className="mt-7">
              <legend className="text-[13px] font-semibold text-[#2B4239]">Category</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {categoryOptions.map((category) => (
                  <Chip
                    key={category.slug}
                    label={category.label}
                    selected={selectedCategories.some(
                      (item) => item.toLowerCase() === category.slug.toLowerCase()
                    )}
                    onToggle={() => toggleCategory(category.slug)}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-7">
              <legend className="text-[13px] font-semibold text-[#2B4239]">Price (GHS)</legend>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block text-[12px] text-[#2B4239]/55">
                  Min
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={minDraft}
                    onChange={(event) => setMinDraft(event.target.value)}
                    onBlur={commitPrice}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }
                    }}
                    placeholder="0"
                    className="mt-1.5 w-full rounded-full border border-[#2B4239]/15 bg-white px-3 py-2 text-sm text-[#2B4239] outline-none focus:border-[#2B4239]/40"
                  />
                </label>
                <label className="block text-[12px] text-[#2B4239]/55">
                  Max
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={maxDraft}
                    onChange={(event) => setMaxDraft(event.target.value)}
                    onBlur={commitPrice}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }
                    }}
                    placeholder="Any"
                    className="mt-1.5 w-full rounded-full border border-[#2B4239]/15 bg-white px-3 py-2 text-sm text-[#2B4239] outline-none focus:border-[#2B4239]/40"
                  />
                </label>
              </div>
            </fieldset>
          </div>
        </aside>

        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#2B4239]/55">
              {results.length} {results.length === 1 ? "product" : "products"}
            </p>
            <label className="flex items-center gap-2 text-sm text-[#2B4239]">
              <span className="text-[#2B4239]/55">Sort</span>
              <select
                value={sort}
                onChange={(event) => {
                  const next = event.target.value;
                  if (next === "newest" || next === "price-asc" || next === "price-desc") {
                    setSort(next);
                  }
                }}
                className="rounded-full border border-[#2B4239]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#2B4239]/40"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-[#2B4239]/20 px-6 py-16 text-center">
              <p
                className="text-[22px] font-medium text-[#2B4239]"
                style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
              >
                No products listed yet
              </p>
              <p className="mt-2 text-sm text-[#2B4239]/55">
                Active products from this shop will show up here.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-[#2B4239]/20 px-6 py-16 text-center">
              <p
                className="text-[22px] font-medium text-[#2B4239]"
                style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
              >
                No products match your filters
              </p>
              <p className="mt-2 text-sm text-[#2B4239]/55">
                Try another keyword or clear some filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center rounded-full bg-[#2B4239] px-5 py-2.5 text-sm font-medium text-[#F5F1E4]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((product) => (
                <article key={product.id} className="group">
                  <Link
                    href={`${productBase}/product/${product.id}`}
                    className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[#EDE8DC]"
                  >
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 640px) 40vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </Link>
                  <div className="mt-3 flex gap-1.5">
                    {product.colors.map((color) => (
                      <span
                        key={color}
                        className="h-2.5 w-2.5 rounded-full ring-1 ring-[#2B4239]/15"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                    ))}
                  </div>
                  <Link href={`${productBase}/product/${product.id}`}>
                    <p className="mt-2 text-[15px] font-semibold leading-snug text-[#2B4239]">
                      {product.name}
                    </p>
                  </Link>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#2B4239]">
                      {formatCedis(product.priceCedis)}
                    </span>
                    <ProductCardActions
                      productId={product.id}
                      name={product.name}
                      priceCedis={product.priceCedis}
                      image={product.image}
                      storeBase={productBase}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function KitchenwareSearchSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-14">
      <div className="h-10 w-40 animate-pulse rounded bg-[#EDE8DC]" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="h-14 animate-pulse rounded-2xl bg-[#EDE8DC] lg:h-72" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#EDE8DC]" />
          ))}
        </div>
      </div>
    </div>
  );
}
