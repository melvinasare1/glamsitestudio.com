"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
  pathname,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    badge?: number;
    external?: boolean;
  }[];
  pathname: string;
}) {
  return (
    <SidebarGroup className="px-3 py-2">
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.external
              ? false
              : item.url === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.url || pathname.startsWith(`${item.url}/`);
            return (
              <SidebarMenuItem
                key={item.title}
                className={
                  isActive
                    ? "after:absolute after:top-1/2 after:-left-3 after:h-5 after:w-[3px] after:-translate-y-1/2 after:rounded-full after:bg-brand"
                    : undefined
                }
              >
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className={cn(
                    "h-10 rounded-xl px-3 text-[13px] font-medium",
                    item.badge != null && item.badge > 0 && "pr-12",
                    isActive
                      ? "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand data-active:bg-brand-soft data-active:text-brand"
                      : "text-muted-foreground hover:bg-mist hover:text-foreground"
                  )}
                >
                  {item.external ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <Icon />
                      <span>{item.title}</span>
                    </a>
                  ) : (
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
                {item.badge != null && item.badge > 0 ? (
                  <SidebarMenuBadge className="right-3 rounded-md bg-delta-up-soft font-semibold text-delta-up">
                    {item.badge}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
