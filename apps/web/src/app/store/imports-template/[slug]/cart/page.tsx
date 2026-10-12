"use client";

import { useParams, usePathname } from "next/navigation";
import { storefrontPublicPath } from "@glamsite/shared/store-domain";
import { ImportsCartView } from "@/app/store/imports-template/cart-view";
import { sellerSlugFromLocation } from "@/lib/store-path";

export default function ImportsSellerCartPage() {
  const pathname = usePathname() ?? "";
  const params = useParams();
  const paramSlug = typeof params.slug === "string" ? params.slug : "";
  const slug = sellerSlugFromLocation(pathname, "imports-template", paramSlug);
  return <ImportsCartView storeSlug={slug} shopHref={storefrontPublicPath(slug)} />;
}
