"use client";

import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { SNEAKER_TEMPLATE_BASE } from "@/components/store/sneaker-template/demo-catalog";
import { useCart } from "@/lib/cart-context";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";

const NAV = [
  { label: "Women", href: (base: string) => `${base}/search?category=${encodeURIComponent("Women")}` },
  { label: "Men", href: (base: string) => `${base}/search?category=${encodeURIComponent("Men")}` },
  { label: "Kids", href: (base: string) => `${base}/search?category=${encodeURIComponent("Kids")}` },
  { label: "Collection", href: (base: string) => `${base}/search?category=${encodeURIComponent("All")}` },
] as const;

export function Header({
  base = SNEAKER_TEMPLATE_BASE,
  brandName = DEFAULT_STORE_NAME,
}: {
  base?: string;
  brandName?: string;
}) {
  const { totalItems, hydrated } = useCart();
  const count = hydrated ? totalItems : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-[#3C2415]/10 bg-[#F5F0EA]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <Link
          href={base}
          className="text-[26px] font-semibold leading-none tracking-tight text-[#2A1C14] sm:text-[30px]"
          style={{ fontFamily: "var(--font-kicks-display), ui-serif, Georgia" }}
        >
          {brandName}
        </Link>

        <nav className="hidden items-center justify-center gap-7 text-[14px] font-medium text-[#2A1C14] lg:flex">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href(base)} className="transition hover:opacity-60">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <Link href={`${base}/search`} aria-label="Search" className="p-2 text-[#2A1C14]">
            <Search className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </Link>
          <Link
            href={`${base}/cart`}
            aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
            className="relative p-2 text-[#2A1C14]"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
            {count > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3C2415] px-1 text-[10px] font-semibold leading-none text-[#F5F0EA]">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      <nav className="flex gap-5 overflow-x-auto px-4 pb-3 text-[13px] font-medium text-[#2A1C14] sm:px-6 lg:hidden">
        {NAV.map((item) => (
          <Link key={item.label} href={item.href(base)} className="shrink-0 whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
