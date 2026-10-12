"use client";

import { useParams, usePathname } from "next/navigation";
import { storefrontPublicPath } from "@glamsite/shared/store-domain";
import { HairCartView } from "@/app/store/hair-beauty-template/cart-view";
import { sellerSlugFromLocation } from "@/lib/store-path";

export default function HairBeautySellerCartPage() {
  const pathname = usePathname() ?? "";
  const params = useParams();
  const paramSlug = typeof params.slug === "string" ? params.slug : "";
  const slug = sellerSlugFromLocation(pathname, "hair-beauty-template", paramSlug);
  return <HairCartView storeSlug={slug} shopHref={storefrontPublicPath(slug)} />;
}
