"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { createClient } from "@glamsite/shared/supabase/client";
import type { Seller, SellerUser } from "@glamsite/shared/types";
import { TRIAL_BANNER_DISMISS_KEY, TRIAL_EXPIRY_MODAL_DISMISS_KEY } from "@/lib/trial";
import { STOREFRONT_NOT_LIVE_MODAL_DISMISS_KEY } from "@/lib/verify";

export type SellerAuthStatus = "loading" | "unauthenticated" | "authenticated";

export type { SellerUser };

type SellerContextValue = {
  status: SellerAuthStatus;
  user: SellerUser | null;
  seller: Seller | null;
  sellerError: string | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const SellerContext = createContext<SellerContextValue | null>(null);

export function SellerProvider({
  children,
  user,
  seller,
  sellerError,
  isAdmin,
}: {
  children: React.ReactNode;
  user: SellerUser;
  seller: Seller | null;
  sellerError: string | null;
  isAdmin: boolean;
}) {
  const signOut = useCallback(async () => {
    try {
      sessionStorage.removeItem(TRIAL_BANNER_DISMISS_KEY);
      sessionStorage.removeItem(TRIAL_EXPIRY_MODAL_DISMISS_KEY);
      sessionStorage.removeItem(STOREFRONT_NOT_LIVE_MODAL_DISMISS_KEY);
    } catch {
      /* private mode */
    }
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      status: "authenticated" as const,
      user,
      seller,
      sellerError,
      isAdmin,
      signOut,
    }),
    [user, seller, sellerError, isAdmin, signOut]
  );

  return <SellerContext.Provider value={value}>{children}</SellerContext.Provider>;
}

export function useSeller() {
  const ctx = useContext(SellerContext);
  if (!ctx) {
    throw new Error("useSeller must be used within SellerProvider");
  }
  return ctx;
}
