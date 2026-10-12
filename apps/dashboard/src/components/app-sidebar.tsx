"use client";

import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { useSeller } from "@/lib/seller-context";
import { storefrontUrl } from "@/lib/storefront-url";
import { templateHasBlog } from "@/lib/storefront-templates";
import {
  BadgeCheckIcon,
  BarChart3Icon,
  ExternalLinkIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  NewspaperIcon,
  PackageIcon,
  PencilIcon,
  SettingsIcon,
  ShoppingBagIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

const navMain: Array<{
  title: string;
  url: string;
  icon: LucideIcon;
  external?: boolean;
}> = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboardIcon },
  {
    title: "Orders",
    url: "/dashboard/orders",
    icon: ShoppingBagIcon,
  },
  { title: "Products", url: "/dashboard/products", icon: PackageIcon },
  { title: "Editor", url: "/dashboard/editor", icon: PencilIcon },
  { title: "Customers", url: "/dashboard/customers", icon: UsersIcon },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3Icon },
  { title: "Support", url: "/dashboard/support", icon: LifeBuoyIcon },
  { title: "Verify", url: "/dashboard/verify", icon: BadgeCheckIcon },
  { title: "Settings", url: "/dashboard/settings", icon: SettingsIcon },
];

const adminNav: Array<{
  title: string;
  url: string;
  icon: LucideIcon;
}> = [
  {
    title: "Platform",
    url: "/dashboard/admin/overview",
    icon: GaugeIcon,
  },
  {
    title: "Billing",
    url: "/dashboard/admin/billing",
    icon: WalletIcon,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { seller, isAdmin } = useSeller();
  const storeUrl = storefrontUrl(seller);
  const items = (() => {
    if (isAdmin && !seller) {
      return [...adminNav];
    }
    const next = [...navMain];
    if (isAdmin) {
      next.unshift(...adminNav);
    }
    if (templateHasBlog(seller?.template)) {
      const editorIndex = next.findIndex((item) => item.url === "/dashboard/editor");
      next.splice(editorIndex + 1, 0, {
        title: "Blog",
        url: "/dashboard/blog",
        icon: NewspaperIcon,
      });
    }
    if (storeUrl) {
      next.push({
        title: "View store",
        url: storeUrl,
        icon: ExternalLinkIcon,
        external: true,
      });
    }
    return next;
  })();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent className="pt-2">
        <NavMain items={items} pathname={pathname} />
      </SidebarContent>
    </Sidebar>
  );
}
