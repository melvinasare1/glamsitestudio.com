"use client";

import { PdpReviews } from "@/components/store/pdp/PdpReviews";
import { STYLECO_CHROME } from "@/components/store/pdp/chrome";

export function ProductReviews({ productId }: { productId: string }) {
  return <PdpReviews productId={productId} chrome={STYLECO_CHROME} />;
}
