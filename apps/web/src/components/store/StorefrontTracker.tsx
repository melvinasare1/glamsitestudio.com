"use client";

import { useEffect } from "react";
import { trackStorefrontView } from "@/lib/track";

/** Invisible. Records a page_view (and product_view when productId is set). */
export function StorefrontTracker({
  storeSlug,
  path,
  productId,
}: {
  storeSlug: string;
  path: string;
  productId?: string;
}) {
  useEffect(() => {
    trackStorefrontView({ storeSlug, path, productId });
  }, [storeSlug, path, productId]);

  return null;
}
