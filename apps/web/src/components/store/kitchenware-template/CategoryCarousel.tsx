"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { KITCHENWARE_TEMPLATE_BASE } from "@/components/store/kitchenware-template/demo-catalog";

export type KitchenCategory = {
  id: string;
  name: string;
  /** Real `products.category` value used as `?category=` on search. */
  category: string;
  image: string;
  imageAlt: string;
};

const VISIBLE = 4;

export default function CategoryCarousel({
  categories,
  storeBase = KITCHENWARE_TEMPLATE_BASE,
}: {
  categories: KitchenCategory[];
  storeBase?: string;
}) {
  const [start, setStart] = useState(0);
  const maxStart = Math.max(0, categories.length - VISIBLE);

  const visible = useMemo(
    () => categories.slice(start, start + VISIBLE),
    [categories, start],
  );

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Previous categories"
        disabled={start === 0}
        onClick={() => setStart((s) => Math.max(0, s - 1))}
        className="absolute -left-5 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#2B4239]/15 bg-white text-[#2B4239] shadow-sm disabled:opacity-30 md:flex"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label="Next categories"
        disabled={start >= maxStart}
        onClick={() => setStart((s) => Math.min(maxStart, s + 1))}
        className="absolute -right-5 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#2B4239]/15 bg-white text-[#2B4239] shadow-sm disabled:opacity-30 md:flex"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {visible.map((c) => (
          <article key={c.id} className="group relative aspect-[3/4] overflow-hidden rounded-md bg-[#EDE8DC]">
            <Image
              src={c.image}
              alt={c.imageAlt}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#142822]/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-3 pb-6 text-center">
              <p
                className="text-[17px] font-medium leading-tight text-white md:text-[19px]"
                style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
              >
                Explore <em className="italic">{c.name}</em>
              </p>
              <Link
                href={`${storeBase}/search?category=${encodeURIComponent(c.category)}`}
                className="mt-3 inline-flex rounded-full bg-[#F5F1E4] px-5 py-1.5 text-[12px] font-medium text-[#2B4239]"
              >
                Shop
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
