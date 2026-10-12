import { CartProvider } from "@/lib/cart-context";
import type { Metadata } from "next";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";

export const metadata: Metadata = {
  title: DEFAULT_STORE_NAME,
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

