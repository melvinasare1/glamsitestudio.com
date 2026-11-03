"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/track";

/** Mounted once per salon site (see app/sites/[slug]/layout.tsx). Starts analytics for that business only. */
export function AnalyticsProvider({ businessId, children }: { businessId: string | null; children: React.ReactNode }) {
  useEffect(() => {
    if (businessId) initAnalytics(businessId);
  }, [businessId]);
  return <>{children}</>;
}
