"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/store/hair-beauty-template/Header";

/** Home is the public `/store/{slug}` URL or the rewritten `/store/{template}/{slug}` URL. */
function isStoreHome(pathname: string, base: string): boolean {
  const path = (pathname || "/").replace(/\/$/, "") || "/";
  const root = (base || "/").replace(/\/$/, "") || "/";
  if (path === root) return true;
  const slug = root.split("/").filter(Boolean).pop();
  if (!slug) return false;
  const parts = path.split("/").filter(Boolean);
  return parts.length === 3 && parts[0] === "store" && parts[2] === slug && parts[1] !== slug;
}

/**
 * Matches CrownedGH site-chrome: home has no sticky header (hero owns nav).
 * Search/cart/product/contact keep the sticky Header.
 */
export function HairBeautyChrome({
  children,
  base,
  brandName,
  logoUrl,
  footer,
}: {
  children: React.ReactNode;
  base: string;
  brandName: string;
  logoUrl?: string;
  footer: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isHome = isStoreHome(pathname, base);

  return (
    <>
      {isHome ? null : <Header base={base} brandName={brandName} logoUrl={logoUrl} />}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
