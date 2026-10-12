"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  productMatchesColour,
  type RideCatalogCard,
  type RideFilterFacets,
} from "@/components/store/motorbike-template/search-filters";
import { RideProductCard } from "@/components/store/motorbike-template/product-card";
import {
  SEARCH_CATEGORIES,
  parseConditionParam,
  parsePriceBound,
  parseRepeatParam,
  parseSearchSort,
  parseVehicleCategoryParam,
  parseYearParam,
  productMatchesVehicleCategory,
  type RideCategorySlug,
  type SearchSort,
} from "@/components/store/motorbike-template/vehicle-categories";

const ORANGE = "#E8622C";

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
      className="rounded-full border px-3.5 py-1.5 text-[12px] font-semibold tracking-wide"
      style={
        selected
          ? { backgroundColor: ORANGE, borderColor: ORANGE, color: "#FFFFFF" }
          : { borderColor: "#141414", color: "#141414", backgroundColor: "transparent" }
      }
    >
      {label}
    </button>
  );
}

function FilterGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  const selectedKeys = new Set(selected.map((item) => item.toLowerCase()));
  return (
    <fieldset className="mt-7">
      <legend className="text-[13px] font-semibold text-[#141414]">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={selectedKeys.has(option.toLowerCase())}
            onToggle={() => onToggle(option)}
          />
        ))}
      </div>
    </fieldset>
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

export function RideSearchCatalog({
  products,
  facets,
  productBase,
}: {
  products: RideCatalogCard[];
  facets: RideFilterFacets;
  productBase: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCategories = parseVehicleCategoryParam(searchParams.getAll("category"));
  const selectedTags = parseRepeatParam(searchParams.getAll("tag"));
  const selectedEngines = parseRepeatParam(searchParams.getAll("engine"));
  const selectedConditions = parseConditionParam(searchParams.getAll("condition"));
  const selectedColours = parseRepeatParam(searchParams.getAll("colour"));
  const selectedYears = parseYearParam(searchParams.getAll("year"));
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

  const toggleCategory = (slug: RideCategorySlug) => {
    replaceParams((params) => {
      const next = parseVehicleCategoryParam(params.getAll("category"));
      const updated = next.includes(slug)
        ? next.filter((item) => item !== slug)
        : [...next, slug];
      setRepeatParam(params, "category", updated);
    });
  };

  const toggleTag = (value: string) => {
    replaceParams((params) => {
      setRepeatParam(params, "tag", toggleNamedValue(parseRepeatParam(params.getAll("tag")), value));
    });
  };

  const toggleEngine = (value: string) => {
    replaceParams((params) => {
      setRepeatParam(
        params,
        "engine",
        toggleNamedValue(parseRepeatParam(params.getAll("engine")), value)
      );
    });
  };

  const toggleColour = (value: string) => {
    replaceParams((params) => {
      setRepeatParam(
        params,
        "colour",
        toggleNamedValue(parseRepeatParam(params.getAll("colour")), value)
      );
    });
  };

  const toggleCondition = (value: "new" | "used") => {
    replaceParams((params) => {
      const next = parseConditionParam(params.getAll("condition"));
      const updated = next.includes(value) ? next.filter((item) => item !== value) : [...next, value];
      setRepeatParam(params, "condition", updated);
    });
  };

  const toggleYear = (year: number) => {
    replaceParams((params) => {
      const next = parseYearParam(params.getAll("year"));
      const updated = next.includes(year) ? next.filter((item) => item !== year) : [...next, year];
      setRepeatParam(
        params,
        "year",
        updated.map((item) => String(item))
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
    selectedTags.length > 0 ||
    selectedEngines.length > 0 ||
    selectedConditions.length > 0 ||
    selectedColours.length > 0 ||
    selectedYears.length > 0 ||
    urlQuery.trim().length > 0 ||
    minPrice != null ||
    maxPrice != null ||
    sort !== "newest";

  const results = useMemo(() => {
    const needle = urlQuery.trim().toLowerCase();
    const filtered = products.filter((product) => {
      if (needle) {
        const haystack = [
          product.name,
          product.description,
          product.category,
          ...product.tags,
          product.engineSize ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (selectedCategories.length > 0) {
        const matches = selectedCategories.some((slug) =>
          productMatchesVehicleCategory(product.category, slug)
        );
        if (!matches) return false;
      }
      if (selectedTags.length > 0) {
        const tags = product.tags.map((tag) => tag.toLowerCase());
        const matches = selectedTags.some((tag) => tags.includes(tag.toLowerCase()));
        if (!matches) return false;
      }
      if (selectedEngines.length > 0) {
        const size = (product.engineSize ?? "").toLowerCase();
        if (!selectedEngines.some((value) => value.toLowerCase() === size)) return false;
      }
      if (selectedConditions.length > 0) {
        if (!product.condition || !selectedConditions.includes(product.condition)) return false;
      }
      if (selectedColours.length > 0) {
        const matches = selectedColours.some((colour) => productMatchesColour(product, colour));
        if (!matches) return false;
      }
      if (selectedYears.length > 0) {
        if (product.year == null || !selectedYears.includes(product.year)) return false;
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
  }, [
    maxPrice,
    minPrice,
    products,
    selectedCategories,
    selectedColours,
    selectedConditions,
    selectedEngines,
    selectedTags,
    selectedYears,
    sort,
    urlQuery,
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-[36px] font-extrabold tracking-tight text-[#141414] md:text-[44px]"
            style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
          >
            Search
          </h1>
          <p className="mt-2 text-sm text-[#141414]/55">
            Find motorbikes, bicycles, mopeds, scooters, and gear.
          </p>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="self-start text-sm font-semibold text-[#141414]/60 underline-offset-4 hover:text-[#141414] hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
        <aside className="rounded-[24px] border border-[#D9D6CE] bg-[#FFFDFA]">
          <button
            type="button"
            className="flex w-full items-center justify-between px-6 py-4 text-left lg:hidden"
            aria-expanded={filtersOpen}
            aria-controls="ride-search-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <span
              className="text-[15px] font-extrabold text-[#141414]"
              style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
            >
              Filter
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-[#141414] transition-transform ${
                filtersOpen ? "rotate-180" : ""
              }`}
              strokeWidth={1.8}
              aria-hidden
            />
          </button>
          <p
            className="hidden px-6 pt-6 text-[15px] font-extrabold text-[#141414] lg:block"
            style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
          >
            Filter
          </p>

          <div
            id="ride-search-filters"
            className={`px-6 pb-6 ${filtersOpen ? "block" : "hidden"} lg:block`}
          >
          <label className="mt-2 block lg:mt-6">
            <span className="text-[13px] font-semibold text-[#141414]">Search</span>
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
              placeholder="Name, tag, or keyword"
              className="mt-2 w-full rounded-lg border border-[#D9D6CE] bg-white px-3 py-2 text-sm text-[#141414] outline-none focus:border-[#141414]"
            />
          </label>

          <fieldset className="mt-7">
            <legend className="text-[13px] font-semibold text-[#141414]">Category</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {SEARCH_CATEGORIES.map((category) => (
                <Chip
                  key={category.slug}
                  label={category.label}
                  selected={selectedCategories.includes(category.slug)}
                  onToggle={() => toggleCategory(category.slug)}
                />
              ))}
            </div>
          </fieldset>

          <FilterGroup
            legend="Tags"
            options={facets.tags}
            selected={selectedTags}
            onToggle={toggleTag}
          />
          <FilterGroup
            legend="Engine size"
            options={facets.engineSizes}
            selected={selectedEngines}
            onToggle={toggleEngine}
          />

          <fieldset className="mt-7">
            <legend className="text-[13px] font-semibold text-[#141414]">Condition</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["new", "used"] as const).map((value) => (
                <Chip
                  key={value}
                  label={value === "new" ? "New" : "Used"}
                  selected={selectedConditions.includes(value)}
                  onToggle={() => toggleCondition(value)}
                />
              ))}
            </div>
          </fieldset>

          <FilterGroup
            legend="Colour"
            options={facets.colours}
            selected={selectedColours}
            onToggle={toggleColour}
          />
          <FilterGroup
            legend="Year"
            options={facets.years.map(String)}
            selected={selectedYears.map(String)}
            onToggle={(value) => toggleYear(Number(value))}
          />

          <fieldset className="mt-7">
            <legend className="text-[13px] font-semibold text-[#141414]">Price (GHS)</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-[12px] text-[#141414]/55">
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
                  className="mt-1.5 w-full rounded-lg border border-[#D9D6CE] bg-white px-3 py-2 text-sm text-[#141414] outline-none focus:border-[#141414]"
                />
              </label>
              <label className="block text-[12px] text-[#141414]/55">
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
                  className="mt-1.5 w-full rounded-lg border border-[#D9D6CE] bg-white px-3 py-2 text-sm text-[#141414] outline-none focus:border-[#141414]"
                />
              </label>
            </div>
          </fieldset>
          </div>
        </aside>

        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#141414]/55">
              {results.length} {results.length === 1 ? "product" : "products"}
            </p>
            <label className="flex items-center gap-2 text-sm text-[#141414]">
              <span className="text-[#141414]/55">Sort</span>
              <select
                value={sort}
                onChange={(event) => {
                  const next = event.target.value;
                  if (next === "newest" || next === "price-asc" || next === "price-desc") {
                    setSort(next);
                  }
                }}
                className="rounded-lg border border-[#D9D6CE] bg-white px-3 py-2 text-sm outline-none focus:border-[#141414]"
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
            <div className="mt-8 rounded-[24px] border border-dashed border-[#D9D6CE] px-6 py-16 text-center">
              <p
                className="text-[22px] font-extrabold text-[#141414]"
                style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
              >
                No products listed yet
              </p>
              <p className="mt-2 text-sm text-[#141414]/55">
                Active products from this shop will show up here.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-dashed border-[#D9D6CE] px-6 py-16 text-center">
              <p
                className="text-[22px] font-extrabold text-[#141414]"
                style={{ fontFamily: "var(--font-ride-display), ui-sans-serif, system-ui" }}
              >
                No products match your filters
              </p>
              <p className="mt-2 text-sm text-[#141414]/55">
                Try another keyword or clear some filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: ORANGE }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((product) => (
                <RideProductCard
                  key={product.id}
                  href={`${productBase}/product/${product.id}`}
                  productId={product.id}
                  name={product.name}
                  priceCedis={product.priceCedis}
                  image={product.image}
                  colors={product.colors}
                  titleAs="h2"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function RideSearchSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-14">
      <div className="h-10 w-40 animate-pulse rounded bg-[#E8E6E1]" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="h-14 animate-pulse rounded-[24px] bg-[#E8E6E1] lg:h-72" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-[24px] bg-[#E8E6E1]" />
          ))}
        </div>
      </div>
    </div>
  );
}
