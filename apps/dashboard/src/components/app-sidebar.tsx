"use client";

import {
  BarChart3Icon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ClockIcon,
  ContactIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MailIcon,
  PaletteIcon,
  PiggyBankIcon,
  ScissorsIcon,
  SettingsIcon,
  TagIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { useBusiness } from "@/lib/business-context";

type NavItem = { title: string; url: string; icon: LucideIcon; external?: boolean; badge?: number };

const NAV: NavItem[] = [
  { title: "Overview", url: "/", icon: LayoutDashboardIcon },
  { title: "Appointments", url: "/appointments", icon: CalendarDaysIcon },
  { title: "Analytics", url: "/analytics", icon: BarChart3Icon },
  { title: "Customers", url: "/customers", icon: ContactIcon },
  { title: "Website", url: "/website", icon: PaletteIcon },
  { title: "Services", url: "/services", icon: ScissorsIcon },
  { title: "Team", url: "/team", icon: UsersIcon },
  { title: "Opening hours", url: "/hours", icon: ClockIcon },
  { title: "Booking", url: "/booking", icon: CalendarClockIcon },
  { title: "Discounts", url: "/discounts", icon: TagIcon },
  { title: "Messages", url: "/messages", icon: MailIcon },
  { title: "Business details", url: "/details", icon: SettingsIcon },
  { title: "Finance", url: "/finance", icon: PiggyBankIcon },
  { title: "Billing", url: "/billing", icon: CreditCardIcon },
  { title: "Support", url: "/support", icon: LifeBuoyIcon },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { business, siteUrl, pendingCount } = useBusiness();
  const nav = NAV.map((item) =>
    item.url === "/appointments" ? { ...item, badge: pendingCount } : item
  );
  const items =
    business.status === "live"
      ? [...nav, { title: "View site", url: siteUrl, icon: ExternalLinkIcon, external: true }]
      : nav;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent className="pt-2">
        <NavMain items={items} pathname={pathname} />
      </SidebarContent>
    </Sidebar>
  );
}
