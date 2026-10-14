"use client";

import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { NavUser } from "@/components/nav-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useBusiness } from "@/lib/business-context";

const STATUS_LABEL = { draft: "Draft", live: "Live", paused: "Paused" } as const;

export function SiteHeader() {
  const { business, siteUrl } = useBusiness();
  const initials = business.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-4 border-b border-black/4 bg-white px-4 lg:px-6">
      <SidebarTrigger className="md:hidden" />
      <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-navy text-[11px] font-semibold tracking-wide text-white">
          {initials || "G"}
        </span>
        <span className="truncate text-base font-semibold tracking-tight">{business.name}</span>
        <Badge
          variant="outline"
          className={business.status === "live" ? "border-delta-up/30 bg-delta-up-soft text-delta-up" : ""}
        >
          {STATUS_LABEL[business.status]}
        </Badge>
      </Link>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {business.status === "live" ? (
          <Button asChild variant="outline" size="lg" className="hidden rounded-full sm:inline-flex">
            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon />
              View site
            </a>
          </Button>
        ) : null}
        <NavUser />
      </div>
    </header>
  );
}
