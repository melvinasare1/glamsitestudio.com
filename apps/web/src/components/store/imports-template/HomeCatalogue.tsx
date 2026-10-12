"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/store/imports-template/ProductCard";
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
    <section aria-labelledby="imports-catalogue-heading">
      <h2 id="imports-catalogue-heading" className="sr-only">
        Browse products
      </h2>
      {categories.length > 0 ? (
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
      <div className="mt-6">
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
          ? "shrink-0 rounded-full bg-[#1266b5] px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1266b5]"
          : "shrink-0 rounded-full bg-[#e8f1fa] px-4 py-2 text-sm font-medium whitespace-nowrap text-[#1266b5] transition-colors hover:bg-[#1266b5]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1266b5]"
      }
    >
      {label}
    </button>
  );
}
