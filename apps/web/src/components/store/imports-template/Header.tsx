"use client";

import Link from "next/link";
import { StoreSearchForm } from "@/components/store/StoreSearchForm";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

const navClass =
  "inline-flex h-11 items-center rounded-lg px-2.5 text-sm font-medium text-[#1a1f2b] transition-colors hover:bg-[#e8f1fa] hover:text-[#1266b5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1266b5]";

export function Header({
  base,
  brandName,
  logoUrl,
}: {
  base: string;
  brandName: string;
  logoUrl?: string;
}) {
  const { totalItems, hydrated } = useCart();
  const count = hydrated ? totalItems : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-[#e4e8ef] bg-white">
      <div className="mx-auto grid max-w-[90rem] grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link
          href={base}
          className="flex items-center gap-2 justify-self-start rounded-lg text-lg font-semibold tracking-tight text-[#1266b5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1266b5]"
        >
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-8 w-auto max-w-[120px] object-contain" />
          ) : null}
          {brandName}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          <Link href={base} className={navClass}>
            Home
          </Link>
          <Link href={`${base}/search`} className={navClass}>
            Shop
          </Link>
          <Link href={`${base}/contact`} className={navClass}>
            Contact
          </Link>
        </nav>

        <div className="flex items-center justify-end gap-1 justify-self-end">
          <StoreSearchForm
            action={`${base}/search`}
            placeholder="Search products…"
            className="hidden w-72 min-w-0 md:block lg:w-80"
            inputClassName="h-11 w-full rounded-lg border border-[#e4e8ef] bg-white px-4 text-sm text-[#1a1f2b] outline-none placeholder:text-[#66707e] focus:border-[#1266b5]"
          />
          <Link
            href={`${base}/cart`}
            aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
            className="relative inline-flex size-11 items-center justify-center rounded-lg text-[#1a1f2b] transition-colors hover:bg-[#e8f1fa] hover:text-[#1266b5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1266b5]"
          >
            <ShoppingCart className="size-5" aria-hidden />
            {count > 0 ? (
              <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-[#1266b5] text-[10px] font-semibold text-white">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-[90rem] items-center gap-2 px-4 pb-3 sm:px-6 lg:hidden lg:px-8">
        <Link href={base} className={navClass}>
          Home
        </Link>
        <Link href={`${base}/search`} className={navClass}>
          Shop
        </Link>
        <Link href={`${base}/contact`} className={navClass}>
          Contact
        </Link>
      </div>
      <div className="mx-auto block max-w-[90rem] px-4 pb-3 sm:px-6 md:hidden lg:px-8">
        <StoreSearchForm
          action={`${base}/search`}
          placeholder="Search products…"
          inputClassName="h-11 w-full rounded-lg border border-[#e4e8ef] bg-white px-4 text-sm text-[#1a1f2b] outline-none placeholder:text-[#66707e] focus:border-[#1266b5]"
        />
      </div>
    </header>
  );
}
