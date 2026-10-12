import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import {
  ANALYTICS_PERIOD_LABELS,
  ANALYTICS_PERIODS,
  emptyAnalytics,
  formatDeltaPercent,
  getSellerAnalytics,
  parseAnalyticsPeriod,
  type AnalyticsPeriod,
} from "@/lib/analytics";
import { formatOrderMoney } from "@/lib/orders";
import { getDashboardSession } from "@/lib/seller";
import { cn } from "@/lib/utils";
import { createClient } from "@glamsite/shared/supabase/server";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const period = parseAnalyticsPeriod(searchParams.period);
  const session = await getDashboardSession();
  const sellerId = session?.seller?.id ?? null;

  let analytics = emptyAnalytics(period);
  let loadError: string | null = null;

  if (sellerId && isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      analytics = await getSellerAnalytics(supabase, sellerId, period);
    } catch (err) {
      console.error("Failed to load analytics", err);
      loadError = "Could not load analytics from Supabase.";
    }
  }

  const pageViewsDelta = formatDeltaPercent(analytics.pageViewsDelta);
  const productViewsDelta = formatDeltaPercent(analytics.productViewsDelta);
  const ordersDelta = formatDeltaPercent(analytics.ordersDelta);
  const aovDelta = formatDeltaPercent(analytics.averageOrderDelta);

  return (
    <div className="px-4 py-4 md:py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-700/50">
          {ANALYTICS_PERIOD_LABELS[period]} · storefront views and orders.
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {ANALYTICS_PERIODS.map((id) => (
            <PeriodTab key={id} id={id} selected={period === id} />
          ))}
        </div>
      </div>

      {loadError ? (
        <p className="mt-6 rounded-xl border border-wire bg-white px-5 py-4 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}

      {!sellerId && !loadError ? (
        <p className="mt-6 rounded-xl border border-wire bg-white px-5 py-4 text-sm text-muted-foreground">
          Link a seller profile to this account to see storefront analytics.
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Page views"
          value={analytics.pageViews.toLocaleString("en-GH")}
          delta={pageViewsDelta}
          positive={(analytics.pageViewsDelta ?? 0) >= 0}
        />
        <StatCard
          label="Product views"
          value={analytics.productViews.toLocaleString("en-GH")}
          delta={productViewsDelta}
          positive={(analytics.productViewsDelta ?? 0) >= 0}
        />
        <StatCard
          label="Orders placed"
          value={analytics.ordersPlaced.toLocaleString("en-GH")}
          delta={ordersDelta}
          positive={(analytics.ordersDelta ?? 0) >= 0}
        />
        <StatCard
          label="Avg. order value"
          value={formatOrderMoney(analytics.averageOrderCedis)}
          delta={aovDelta}
          positive={(analytics.averageOrderDelta ?? 0) >= 0}
        />
      </div>

      <div className="mt-6 rounded-xl border border-wire bg-white p-5">
        <h2 className="font-display text-base font-semibold text-ink-950">Revenue and views</h2>
        {analytics.chart.some((point) => point.revenue > 0 || point.impressions > 0) ? (
          <div className="mt-4 h-72">
            <RevenueChart data={analytics.chart} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No storefront views or orders in this period yet. The chart will fill in as shoppers visit
            your store and place orders.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-wire bg-white p-5">
        <h2 className="font-display text-base font-semibold text-ink-950">Most viewed products</h2>
        {analytics.topProducts.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No product views in this period yet. Views are recorded when shoppers open a product page.
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-black/6">
            {analytics.topProducts.map((product, index) => (
              <li key={product.productId} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-950">
                    <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}.</span>
                    {product.name}
                  </p>
                </div>
                <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {product.views.toLocaleString("en-GH")}{" "}
                  {product.views === 1 ? "view" : "views"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function PeriodTab({ id, selected }: { id: AnalyticsPeriod; selected: boolean }) {
  const href = id === "30d" ? "/dashboard/analytics" : `/dashboard/analytics?period=${id}`;
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm transition-colors",
        selected
          ? "border border-black/8 bg-muted text-ink-950"
          : "text-muted-foreground hover:text-ink-950"
      )}
    >
      {ANALYTICS_PERIOD_LABELS[id]}
    </Link>
  );
}
