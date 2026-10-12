"use client";

import { useParams, usePathname } from "next/navigation";
import { storefrontPublicPath } from "@glamsite/shared/store-domain";
import { SneakerCartView } from "@/app/store/sneaker-template/cart-view";
import { sellerSlugFromLocation } from "@/lib/store-path";

export default function SneakerSellerCartPage() {
  const pathname = usePathname() ?? "";
  const params = useParams();
  const paramSlug = typeof params.slug === "string" ? params.slug : "";
  const slug = sellerSlugFromLocation(pathname, "sneaker-template", paramSlug);
  return <SneakerCartView storeSlug={slug} shopHref={storefrontPublicPath(slug)} />;
}
