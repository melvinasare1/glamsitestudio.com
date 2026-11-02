"use client";

import {
  CalendarClockIcon,
  CalendarDaysIcon,
  ClockIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MailIcon,
  PaletteIcon,
  ScissorsIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { useBusiness } from "@/lib/business-context";

type NavItem = { title: string; url: string; icon: LucideIcon; external?: boolean; badge?: number };

const NAV: NavItem[] = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Appointments", url: "/dashboard/appointments", icon: CalendarDaysIcon },
  { title: "Website", url: "/dashboard/website", icon: PaletteIcon },
  { title: "Services", url: "/dashboard/services", icon: ScissorsIcon },
  { title: "Team", url: "/dashboard/team", icon: UsersIcon },
  { title: "Opening hours", url: "/dashboard/hours", icon: ClockIcon },
  { title: "Booking", url: "/dashboard/booking", icon: CalendarClockIcon },
  { title: "Messages", url: "/dashboard/messages", icon: MailIcon },
  { title: "Business details", url: "/dashboard/details", icon: SettingsIcon },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCardIcon },
  { title: "Support", url: "/dashboard/support", icon: LifeBuoyIcon },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { business, siteUrl, pendingCount } = useBusiness();
  const nav = NAV.map((item) =>
    item.url === "/dashboard/appointments" ? { ...item, badge: pendingCount } : item
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
