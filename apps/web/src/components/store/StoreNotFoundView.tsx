"use client";

import { usePathname } from "next/navigation";
import { NotFoundView } from "@/components/NotFoundView";
import { storeHomeHref } from "@/lib/store-path";

export function StoreNotFoundView() {
  const pathname = usePathname();
  return <NotFoundView homeHref={storeHomeHref(pathname)} />;
}
