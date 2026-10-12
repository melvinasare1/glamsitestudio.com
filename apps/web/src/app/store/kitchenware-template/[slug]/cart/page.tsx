"use client";

import { useParams, usePathname } from "next/navigation";
import { storefrontPublicPath } from "@glamsite/shared/store-domain";
import { KitchenwareCartView } from "@/app/store/kitchenware-template/cart-view";
import { sellerSlugFromLocation } from "@/lib/store-path";

export default function KitchenwareSellerCartPage() {
  const pathname = usePathname() ?? "";
  const params = useParams();
  const paramSlug = typeof params.slug === "string" ? params.slug : "";
  const slug = sellerSlugFromLocation(pathname, "kitchenware-template", paramSlug);
  return (
    <KitchenwareCartView storeSlug={slug} shopHref={storefrontPublicPath(slug)} />
  );
}
