"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCardActions } from "@/components/store/kitchenware-template/AddToCartButton";
import { KITCHENWARE_TEMPLATE_BASE } from "@/components/store/kitchenware-template/demo-catalog";

export type KitchenProduct = {
  id: string;
  name: string;
  price: string;
  priceCedis: number;
  badge: "Promotion" | "New" | "Customer favorite";
  colors: string[];
  image: string;
  imageAlt: string;
};

const VISIBLE = 4;

export default function ProductCarousel({
  products,
  productBase = KITCHENWARE_TEMPLATE_BASE,
}: {
  products: KitchenProduct[];
  productBase?: string;
}) {
  const [start, setStart] = useState(0);
  const maxStart = Math.max(0, products.length - VISIBLE);

  const visible = useMemo(
    () => products.slice(start, start + VISIBLE),
    [products, start]
  );

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Previous products"
        disabled={start === 0}
        onClick={() => setStart((s) => Math.max(0, s - 1))}
        className="absolute -left-5 top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#2B4239]/15 bg-white text-[#2B4239] shadow-sm disabled:opacity-30 md:flex"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label="Next products"
        disabled={start >= maxStart}
        onClick={() => setStart((s) => Math.min(maxStart, s + 1))}
        className="absolute -right-5 top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#2B4239]/15 bg-white text-[#2B4239] shadow-sm disabled:opacity-30 md:flex"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
        {visible.map((p) => (
          <article key={p.id} className="group">
            <Link
              href={`${productBase}/product/${p.id}`}
              className="relative block aspect-[4/5] overflow-hidden bg-[#EDE8DC]"
            >
              <span className="absolute left-3 top-3 z-10 rounded-full bg-[#F5F1E4] px-3 py-1 text-[11px] font-medium text-[#2B4239]">
                {p.badge}
              </span>
              {p.image ? (
                <Image
                  src={p.image}
                  alt={p.imageAlt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : null}
            </Link>
            <div className="mt-3 flex gap-1.5">
              {p.colors.map((c) => (
                <span
                  key={c}
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-[#2B4239]/15"
                  style={{ backgroundColor: c }}
                  aria-hidden
                />
              ))}
            </div>
            <Link href={`${productBase}/product/${p.id}`}>
              <p className="mt-2 text-[15px] font-semibold leading-snug text-[#2B4239]">{p.name}</p>
            </Link>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#2B4239]">{p.price}</span>
              <ProductCardActions
                productId={p.id}
                name={p.name}
                priceCedis={p.priceCedis}
                image={p.image}
                storeBase={productBase}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
