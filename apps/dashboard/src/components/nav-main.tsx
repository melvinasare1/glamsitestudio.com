"use client";

import Link from "next/link";
import { Loader2Icon, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: number;
  external?: boolean;
};

/** One section of the sidebar. `label` omitted for an unlabelled top group. */
export type NavSection = { label?: string; items: NavItem[] };

export function NavMain({ sections, pathname }: { sections: NavSection[]; pathname: string }) {
  // Clicking a link feels instant (no page has changed yet, data is still
  // loading), so track which item was just clicked and show a spinner on it
  // until the route actually changes -- see also (owner)/loading.tsx for the
  // matching skeleton in the content area.
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const { setOpenMobile } = useSidebar();
  // The mobile sidebar is a Sheet that unmounts its content on close, so this
  // component remounts (with the pathname already set to its current value)
  // every time it's opened. Compare against the *previous* pathname rather
  // than a mounted flag -- a flag flips on React's extra dev-mode effect
  // invocation even though the pathname never changed, closing the sheet
  // right after it opens.
  const previousPathname = useRef(pathname);
  useEffect(() => {
    setPendingHref(null);
    if (previousPathname.current !== pathname) {
      // On mobile, once the new page has loaded (pathname changed) there's
      // no reason to keep the overlay menu open.
      setOpenMobile(false);
    }
    previousPathname.current = pathname;
  }, [pathname, setOpenMobile]);

  return (
    <>
      {sections.map((section, index) => (
        <NavGroup
          key={section.label ?? index}
          label={section.label}
          items={section.items}
          pathname={pathname}
          pendingHref={pendingHref}
          onNavigate={setPendingHref}
        />
      ))}
    </>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  pendingHref,
  onNavigate,
}: {
  label?: string;
  items: NavItem[];
  pathname: string;
  pendingHref: string | null;
  onNavigate: (href: string) => void;
}) {
  return (
    <SidebarGroup className="px-3 py-2">
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.external
              ? false
              : item.url === "/"
                ? pathname === "/"
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
                    <Link
                      href={item.url}
                      onClick={() => {
                        if (!isActive) onNavigate(item.url);
                      }}
                    >
                      {pendingHref === item.url ? <Loader2Icon className="animate-spin" /> : <Icon />}
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

