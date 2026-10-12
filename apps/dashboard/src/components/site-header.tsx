"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSeller } from "@/lib/seller-context";
import { BellIcon, SearchIcon, SunIcon } from "lucide-react";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/orders": "Orders",
  "/dashboard/products": "Products",
  "/dashboard/editor": "Editor",
  "/dashboard/customers": "Customers",
  "/dashboard/analytics": "Analytics",
  "/dashboard/support": "Support",
  "/dashboard/billing": "Billing",
  "/dashboard/verify": "Verify",
  "/dashboard/settings": "Settings",
};

export function SiteHeader() {
  const { seller, isAdmin } = useSeller();
  const businessName =
    seller?.businessName.trim() || (isAdmin ? "Glam Site Studios" : "Dashboard");
  const initials = businessName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-4 border-b border-black/4 bg-white px-4 lg:px-6">
      <SidebarTrigger className="md:hidden" />
      <Link
        href={isAdmin && !seller ? "/dashboard/admin/overview" : "/dashboard"}
        className="flex min-w-0 shrink-0 items-center gap-2.5"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-[11px] font-semibold tracking-wide text-white">
          {initials || "S"}
        </span>
        <span className="truncate text-base font-semibold tracking-tight">{businessName}</span>
      </Link>
      <div className="hidden min-w-0 flex-1 justify-center sm:flex">
        <label className="relative w-full max-w-xl">
          <span className="sr-only">Search</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search anything..."
            autoComplete="off"
            className="h-10 w-full rounded-full bg-mist pr-14 pl-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-brand/20"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md border border-black/8 bg-white px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </label>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Toggle theme"
          className="size-10 rounded-full border-black/8 bg-white"
        >
          <SunIcon className="size-4 text-muted-foreground" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Notifications"
          className="relative size-10 rounded-full border-black/8 bg-white"
        >
          <BellIcon className="size-4 text-muted-foreground" />
          <span aria-hidden="true" className="absolute top-2 right-2 size-1.5 rounded-full bg-brand" />
        </Button>
        <NavUser />
      </div>
    </header>
  );
}

export function DashboardHeading() {
  const pathname = usePathname();
  // Products owns its heading so it can sit on the same row as "Add New Product".
  if (pathname.startsWith("/dashboard/products")) {
    return null;
  }
  // Order and customer detail own their headings so they can sit with the back link.
  if (pathname.startsWith("/dashboard/orders/") || pathname.startsWith("/dashboard/customers/")) {
    return null;
  }
  const title = pathname.startsWith("/dashboard/admin/billing")
    ? "Platform billing"
    : pathname.startsWith("/dashboard/admin")
      ? "Platform overview"
      : (titles[pathname] ?? "Dashboard");

  return (
    <div className="px-4 pt-6 lg:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
    </div>
  );
}
