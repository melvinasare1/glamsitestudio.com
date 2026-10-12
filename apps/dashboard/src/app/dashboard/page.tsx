import StorefrontNotLiveModal from "@/components/dashboard/StorefrontNotLiveModal";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { emptyOverviewStats, getOverviewStats } from "@/lib/analytics";
import { getRecentDashboardOrders, type DashboardOrder } from "@/lib/overview";
import { getDashboardSession } from "@/lib/seller";
import { createClient } from "@glamsite/shared/supabase/server";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";

export default async function DashboardOverviewPage() {
  const session = await getDashboardSession();
  const sellerId = session?.seller?.id ?? null;
  const showNotLiveModal = Boolean(
    session?.seller && session.seller.status !== "active"
  );

  let stats = emptyOverviewStats();
  let recentOrders: DashboardOrder[] = [];
  let loadError: string | null = null;

  if (sellerId && isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const [overview, orders] = await Promise.all([
        getOverviewStats(supabase, sellerId),
        getRecentDashboardOrders(supabase, sellerId, 5),
      ]);
      stats = overview;
      recentOrders = orders;
    } catch (err) {
      console.error("Failed to load overview stats", err);
      loadError = "Could not load overview from Supabase.";
    }
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <StorefrontNotLiveModal open={showNotLiveModal} />
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {loadError ? (
          <p className="mx-4 rounded-xl border border-wire bg-white px-5 py-4 text-sm text-muted-foreground lg:mx-6">
            {loadError}
          </p>
        ) : null}
        {!sellerId && !loadError ? (
          <p className="mx-4 rounded-xl border border-wire bg-white px-5 py-4 text-sm text-muted-foreground lg:mx-6">
            Link a seller profile to this account to see storefront stats.
          </p>
        ) : null}
        <SectionCards stats={stats} />
        <DataTable data={recentOrders} />
      </div>
    </div>
  );
}
