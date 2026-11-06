"use client";

import {
  BarChart3Icon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ContactIcon,
  ExternalLinkIcon,
  GiftIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  LifeBuoyIcon,
  MailIcon,
  PaletteIcon,
  PiggyBankIcon,
  ScissorsIcon,
  Settings2Icon,
  SettingsIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { NavMain, type NavSection } from "@/components/nav-main";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { useBusiness } from "@/lib/business-context";

const SECTIONS: NavSection[] = [
  { items: [{ title: "Overview", url: "/", icon: LayoutDashboardIcon }] },
  {
    label: "Bookings",
    items: [
      { title: "Appointments", url: "/appointments", icon: CalendarDaysIcon },
      { title: "Customers", url: "/customers", icon: ContactIcon },
      { title: "Booking", url: "/booking", icon: CalendarClockIcon },
      { title: "Discounts", url: "/discounts", icon: TagIcon },
      { title: "Referrals", url: "/referrals", icon: GiftIcon },
    ],
  },
  {
    label: "Site",
    items: [
      { title: "Website", url: "/website", icon: PaletteIcon },
      { title: "Templates", url: "/templates", icon: LayoutTemplateIcon },
      { title: "Services", url: "/services", icon: ScissorsIcon },
      { title: "Team", url: "/team", icon: UsersIcon },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Analytics", url: "/analytics", icon: BarChart3Icon },
      { title: "Finance", url: "/finance", icon: PiggyBankIcon },
      { title: "Messages", url: "/messages", icon: MailIcon },
      { title: "Business details", url: "/details", icon: SettingsIcon },
      { title: "Settings", url: "/settings", icon: Settings2Icon },
      { title: "Earn", url: "/earn", icon: HandCoinsIcon },
    ],
  },
  { items: [{ title: "Support", url: "/support", icon: LifeBuoyIcon }] },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { business, siteUrl, pendingCount } = useBusiness();

  const sections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => (item.url === "/appointments" ? { ...item, badge: pendingCount } : item)),
  }));
  const withSite: NavSection[] =
    business.status === "live"
      ? [...sections, { items: [{ title: "View site", url: siteUrl, icon: ExternalLinkIcon, external: true }] }]
      : sections;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent className="pt-2">
        <NavMain sections={withSite} pathname={pathname} />
      </SidebarContent>
    </Sidebar>
  );
}
