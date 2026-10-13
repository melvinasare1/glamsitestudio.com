"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { BusinessProvider } from "@/lib/business-context";
import type { Business, OwnerUser } from "@glamsite/shared/types";

export function DashboardShell({
  user,
  business,
  children,
}: {
  user: OwnerUser;
  business: Business;
  children: React.ReactNode;
}) {
  return (
    <BusinessProvider user={user} business={business}>
      <SidebarProvider
        className="flex-col"
        style={{ "--sidebar-width": "15rem", "--header-height": "4rem" } as React.CSSProperties}
      >
        <SiteHeader />
        <div className="flex min-h-0 flex-1">
          <AppSidebar className="top-(--header-height)! bottom-0! h-auto!" />
          <SidebarInset className="bg-mist">
            <div className="flex flex-1 flex-col pb-12">{children}</div>
          </SidebarInset>
        </div>
        <Toaster position="bottom-right" />
      </SidebarProvider>
    </BusinessProvider>
  );
}
