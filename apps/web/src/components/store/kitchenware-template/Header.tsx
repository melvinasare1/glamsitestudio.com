"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { KITCHENWARE_TEMPLATE_BASE } from "@/components/store/kitchenware-template/demo-catalog";
import { useCart } from "@/lib/cart-context";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";

export function Header({
  base = KITCHENWARE_TEMPLATE_BASE,
  brandName = DEFAULT_STORE_NAME,
}: {
  base?: string;
  brandName?: string;
}) {
  const router = useRouter();
  const { totalItems, hydrated } = useCart();
  const count = hydrated ? totalItems : 0;
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `${base}/search?q=${encodeURIComponent(next)}` : `${base}/search`);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#2B4239]/10 bg-white">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center px-6 py-5 md:px-10">
        <nav className="hidden items-center gap-7 text-[15px] font-medium text-[#111111] md:flex">
          <Link href={`${base}/search`}>Shop</Link>
          <Link href={`${base}#bestsellers`}>Bestsellers</Link>
        </nav>

        <Link
          href={base}
          className="text-center text-[28px] font-medium tracking-[0.04em] text-[#111111] md:text-[32px]"
          style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
        >
          {brandName}
        </Link>

        <div className="flex items-center justify-end gap-3">
          <form onSubmit={handleSearch} className="relative hidden w-full max-w-[200px] md:block">
            <label>
              <span className="sr-only">Search products</span>
              <input
                type="search"
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Product..."
                className="h-10 w-full rounded-full border border-[#2B4239]/20 bg-[#EDF1EA] px-4 pr-10 text-sm text-[#111111] placeholder:text-[#111111]/50 outline-none"
              />
            </label>
            <button
              type="submit"
              aria-label="Submit search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#111111]"
            >
              <Search className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </form>
          <Link
            href={`${base}/cart`}
            aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
            className="relative p-1 text-[#111111]"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.6} />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2B4239] px-1 text-[10px] font-semibold leading-none text-[#F5F1E4]">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
