"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { rideCartHrefFromPath } from "@/components/store/motorbike-template/demo-catalog";
import { useCart } from "@/lib/cart-context";

export function RideCartLink() {
  const pathname = usePathname() ?? "";
  const href = rideCartHrefFromPath(pathname);
  const { totalItems, hydrated } = useCart();
  const count = hydrated ? totalItems : 0;

  return (
    <Link
      href={href}
      aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
      className="relative p-1 text-white"
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white" style={{ backgroundColor: "#E8622C" }}>
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
