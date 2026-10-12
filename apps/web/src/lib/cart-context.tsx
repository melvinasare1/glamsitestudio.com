"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { cartLineId, productIdFromCartLine } from "@/lib/checkout";

export type CartItem = {
  productId: string;
  name: string;
  priceCedis: number;
  quantity: number;
  image: string;
  sellerId: string;
  /** Buyer-selected variant — not stored on the product document. */
  size?: string;
  color?: string;
  /** Multi-axis selections (axis name → value). */
  selectedVariants?: Record<string, string>;
};

export type AddItemInput = Omit<CartItem, "quantity" | "sellerId"> & {
  quantity?: number;
};

type CartContextValue = {
  sellerId: string;
  items: CartItem[];
  hydrated: boolean;
  addItem: (item: AddItemInput) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalCedis: number;
};

const STORAGE_VERSION = 1;

type StoredCart = {
  v: number;
  items: CartItem[];
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(sellerId: string) {
  return `cart:${sellerId}`;
}

const RESERVED_STORE_SEGMENTS = new Set(["product", "cart", "search", "blog", "contact"]);

function sellerIdFromPath(pathname: string): string {
  const match = pathname.match(/^\/store\/([^/]+)(?:\/([^/]+))?/);
  const template = match?.[1] ?? "";
  const segment = match?.[2] ?? "";
  if (!segment || RESERVED_STORE_SEGMENTS.has(segment)) return template;
  return segment;
}

function isSelectedVariants(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.priceCedis === "number" &&
    Number.isFinite(item.priceCedis) &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    typeof item.image === "string" &&
    typeof item.sellerId === "string" &&
    (item.size === undefined || typeof item.size === "string") &&
    (item.color === undefined || typeof item.color === "string") &&
    (item.selectedVariants === undefined || isSelectedVariants(item.selectedVariants))
  );
}

/** Stable identity for a cart line, including multi-axis selections. */
export function cartItemLineKey(
  item: Pick<CartItem, "productId" | "size" | "color" | "selectedVariants">
): string {
  const baseId = productIdFromCartLine(item.productId) || item.productId;
  return cartLineId(baseId, {
    size: item.size,
    color: item.color,
    selectedVariants: item.selectedVariants,
  });
}

function readCart(sellerId: string): CartItem[] {
  if (!sellerId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(sellerId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(isCartItem);
    }
    const stored = parsed as StoredCart;
    if (stored?.v === STORAGE_VERSION && Array.isArray(stored.items)) {
      return stored.items.filter(isCartItem);
    }
    return [];
  } catch {
    return [];
  }
}

function writeCart(sellerId: string, items: CartItem[]) {
  if (!sellerId || typeof window === "undefined") return;
  const payload: StoredCart = { v: STORAGE_VERSION, items };
  window.localStorage.setItem(storageKey(sellerId), JSON.stringify(payload));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const sellerId = sellerIdFromPath(pathname);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const hydrated = loadedFor === sellerId;

  useEffect(() => {
    setItems(readCart(sellerId));
    setLoadedFor(sellerId);
  }, [sellerId]);

  useEffect(() => {
    if (loadedFor !== sellerId) return;
    writeCart(sellerId, items);
  }, [items, sellerId, loadedFor]);

  const addItem = useCallback(
    (item: AddItemInput) => {
      if (!sellerId || loadedFor !== sellerId) return;
      const quantity = item.quantity ?? 1;
      const lineKey = cartItemLineKey(item);
      setItems((current) => {
        const existing = current.find((entry) => cartItemLineKey(entry) === lineKey);
        if (existing) {
          return current.map((entry) =>
            cartItemLineKey(entry) === lineKey
              ? {
                  ...entry,
                  productId: lineKey,
                  quantity: entry.quantity + quantity,
                  name: item.name,
                  priceCedis: item.priceCedis,
                  image: item.image,
                  size: item.size,
                  color: item.color,
                  selectedVariants: item.selectedVariants,
                }
              : entry
          );
        }
        return [
          ...current,
          {
            productId: lineKey,
            name: item.name,
            priceCedis: item.priceCedis,
            image: item.image,
            quantity,
            sellerId,
            size: item.size,
            color: item.color,
            selectedVariants: item.selectedVariants,
          },
        ];
      });
    },
    [sellerId, loadedFor]
  );

  const removeItem = useCallback((productId: string) => {
    setItems((current) =>
      current.filter((entry) => {
        if (entry.productId === productId) return false;
        return cartItemLineKey(entry) !== productId;
      })
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) => {
      if (quantity < 1) {
        return current.filter((entry) => {
          if (entry.productId === productId) return false;
          return cartItemLineKey(entry) !== productId;
        });
      }
      return current.map((entry) =>
        entry.productId === productId || cartItemLineKey(entry) === productId
          ? { ...entry, quantity }
          : entry
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, entry) => sum + entry.quantity, 0),
    [items]
  );

  const totalCedis = useMemo(
    () => items.reduce((sum, entry) => sum + entry.priceCedis * entry.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      sellerId,
      items,
      hydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalCedis,
    }),
    [
      sellerId,
      items,
      hydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalCedis,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
