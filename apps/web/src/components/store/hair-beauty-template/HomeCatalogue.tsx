"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/store/hair-beauty-template/ProductCard";
import type { Product } from "@glamsite/shared/types";

export function HomeCatalogue({
  products,
  productBase,
}: {
  products: Product[];
  productBase: string;
}) {
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

  const [selected, setSelected] = useState("all");
  const visible =
    selected === "all"
      ? products
      : products.filter((product) => product.category.trim().toLowerCase() === selected.toLowerCase());

  return (
    <section aria-labelledby="hair-catalogue-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#8a8165] uppercase">
            Collection
          </p>
          <h2
            id="hair-catalogue-heading"
            className="mt-2 text-2xl font-medium tracking-tight text-[#4f4a3d] sm:text-3xl"
            style={{ fontFamily: "var(--font-hair-display), ui-serif, Georgia" }}
          >
            Shop the collection
          </h2>
        </div>
      </div>

      {categories.length > 0 ? (
        <div
          className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filter by category"
        >
          <CategoryPill label="All" pressed={selected === "all"} onClick={() => setSelected("all")} />
          {categories.map((category) => (
            <CategoryPill
              key={category}
              label={category}
              pressed={selected.toLowerCase() === category.toLowerCase()}
              onClick={() => setSelected(category)}
            />
          ))}
        </div>
      ) : null}
      <div className="mt-8">
        <ProductGrid
          products={visible}
          productBase={productBase}
          emptyTitle="No products in this category"
          emptyDescription="Try another category, or browse the full catalogue."
        />
      </div>
    </section>
  );
}

function CategoryPill({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={
        pressed
          ? "shrink-0 rounded-full bg-[#8a8165] px-4 py-2 text-sm font-medium whitespace-nowrap text-[#f7f1df] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a8165]"
          : "shrink-0 rounded-full border border-[#d9cfc3] bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-[#4f4a3d] transition-colors hover:border-[#c4b896] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a8165]"
      }
    >
      {label}
    </button>
  );
}
