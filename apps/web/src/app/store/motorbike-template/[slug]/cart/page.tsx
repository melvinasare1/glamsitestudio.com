"use client";

import { useParams, usePathname } from "next/navigation";
import { RideCartView } from "@/components/store/motorbike-template/cart-view";
import { sellerSlugFromLocation } from "@/lib/store-path";

export default function MotorbikeTemplateSellerCartPage() {
  const pathname = usePathname() ?? "";
  const params = useParams();
  const paramSlug = typeof params.slug === "string" ? params.slug : "";
  const slug = sellerSlugFromLocation(pathname, "motorbike-template", paramSlug);
  return <RideCartView storeSlug={slug} />;
}
