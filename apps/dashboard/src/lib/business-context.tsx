"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { siteUrl } from "@glamsite/shared/domain";
import { createClient } from "@glamsite/shared/supabase/client";
import type { Business, OwnerUser } from "@glamsite/shared/types";

type BusinessContextValue = {
  user: OwnerUser;
  business: Business;
  /** Public address of the site (shows only once it's live). */
  siteUrl: string;
  /** Upcoming online bookings waiting for the owner to confirm. */
  pendingCount: number;
  signOut: () => Promise<void>;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({
  user,
  business,
  pendingCount,
  children,
}: {
  user: OwnerUser;
  business: Business;
  pendingCount: number;
  children: React.ReactNode;
}) {
  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, business, siteUrl: siteUrl(business), pendingCount, signOut }),
    [user, business, pendingCount, signOut]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}
