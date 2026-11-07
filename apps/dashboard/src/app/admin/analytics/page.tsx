import Link from "next/link";
import { businessFromRow } from "@glamsite/shared/mappers";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import type { Business } from "@glamsite/shared/types";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageBody, PageHeader, Panel } from "@/components/page";
import {
  getBrowserBreakdown,
  getCountryBreakdown,
  getDeviceTypeBreakdown,
  getOsBreakdown,
  getPlatformDailyTrend,
  getPlatformReferrers,
  getPlatformTopPages,
  getPlatformVisitStats,
  getVisitStatsByBusiness,
  isPostHogConfigured,
  type BusinessVisitStats,
} from "@/lib/posthog";
import { BreakdownPie, DailyTrendChart, FunnelChart, SignupsChart } from "./charts";

export const dynamic = "force-dynamic";

const RANGE_OPTIONS = [7, 30, 90] as const;
const DEFAULT_DAYS = 30;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</dd>
    </div>
  );
}

function RangeTabs({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-black/10 bg-white p-1 text-sm">
      {RANGE_OPTIONS.map((option) => (
        <Link
          key={option}
          href={`/admin/analytics?days=${option}`}
          className={`rounded-md px-3 py-1 font-medium ${
            option === days ? "bg-navy text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option}d
        </Link>
      ))}
    </div>
  );
}

/** Mondays of the last `weeks` weeks (UTC), oldest first — used to bucket business signups. */
function recentWeekStarts(weeks: number): Date[] {
  const now = new Date();
  const dayOfWeek = (now.getUTCDay() + 6) % 7; // 0 = Monday
  const thisMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOfWeek));
  return Array.from({ length: weeks }, (_, i) => new Date(thisMonday.getTime() - (weeks - 1 - i) * 7 * 24 * 60 * 60 * 1000));
}

function bucketSignupsByWeek(businesses: Business[], weeks = 12) {
  const starts = recentWeekStarts(weeks);
  const counts = starts.map(() => 0);
  for (const business of businesses) {
    if (!business.createdAt) continue;
    const createdAt = new Date(business.createdAt).getTime();
    for (let i = starts.length - 1; i >= 0; i--) {
      if (createdAt >= starts[i].getTime()) {
        counts[i]++;
        break;
      }
    }
  }
  return starts.map((start, i) => ({
    week: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count: counts[i],
  }));
}

/**
 * Platform-wide analytics for staff (gated by requireAdmin() in
 * admin/layout.tsx). Everything here is the un-scoped version of the owner
 * Analytics page in (owner)/analytics — same PostHog events, aggregated
 * across every business instead of filtered to one — plus a per-business
 * leaderboard and a signups chart sourced from Supabase.
 */
export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const parsedDays = Number(daysParam);
  const days = RANGE_OPTIONS.includes(parsedDays as (typeof RANGE_OPTIONS)[number]) ? parsedDays : DEFAULT_DAYS;

  if (!isPostHogConfigured()) {
    return (
      <>
        <PageHeader title="Analytics" description="Platform-wide traffic and conversion data." />
        <PageBody className="max-w-6xl">
          <Panel>
            <EmptyState title="Analytics isn't set up yet">Set the POSTHOG_* environment variables to turn this on.</EmptyState>
          </Panel>
        </PageBody>
      </>
    );
  }

  const supabase = createAdminClient();
  const [
    stats,
    dailyTrend,
    topPages,
    referrers,
    browsers,
    operatingSystems,
    deviceTypes,
    countries,
    businessStats,
    { data: businessRows, error: businessError },
  ] = await Promise.all([
    getPlatformVisitStats(days),
    getPlatformDailyTrend(days),
    getPlatformTopPages(days),
    getPlatformReferrers(days),
    getBrowserBreakdown(days),
    getOsBreakdown(days),
    getDeviceTypeBreakdown(days),
    getCountryBreakdown(days),
    getVisitStatsByBusiness(days),
    supabase.from("businesses").select("id, name, slug, created_at").order("created_at", { ascending: false }),
  ]);
  if (businessError) console.error("[admin/analytics] businesses lookup failed", businessError.message);

  const businesses: Business[] = (businessRows ?? []).map(businessFromRow);
  const businessNameById = new Map(businesses.map((business) => [business.id, business.name || business.slug]));
  const signupsByWeek = bucketSignupsByWeek(businesses);

  const noTraffic = stats.visitors === 0 && stats.pageviews === 0;

  const funnelData = [
    { stage: "Page views", count: stats.pageviews },
    { stage: "Enquiries sent", count: stats.enquiries },
    { stage: "Bookings started", count: stats.bookingsStarted },
    { stage: "Checkouts started", count: stats.checkoutsStarted },
    { stage: "Bookings made", count: stats.bookingsCreated },
  ];

  const leaderboard: (BusinessVisitStats & { name: string })[] = businessStats
    .map((row) => ({ ...row, name: businessNameById.get(row.businessId) ?? row.businessId }))
    .slice(0, 25);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Every visit, enquiry and booking across every business on the platform."
        actions={<RangeTabs days={days} />}
      />
      <PageBody className="max-w-6xl">
        <Panel title="Platform traffic" description={`Last ${days} days, all businesses combined.`}>
          {noTraffic ? (
            <EmptyState title="No visits yet">Once people start viewing sites, traffic will show up here.</EmptyState>
          ) : (
            <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Visitors" value={stats.visitors} />
              <Stat label="Page views" value={stats.pageviews} />
              <Stat label="Enquiries sent" value={stats.enquiries} />
              <Stat label="Bookings started" value={stats.bookingsStarted} />
              <Stat label="Checkouts started" value={stats.checkoutsStarted} />
              <Stat label="Bookings made" value={stats.bookingsCreated} />
            </dl>
          )}
        </Panel>

        {!noTraffic && (
          <Panel title="Traffic trend" description="Visitors and page views per day.">
            <DailyTrendChart data={dailyTrend} />
          </Panel>
        )}

        {!noTraffic && (
          <Panel title="Conversion funnel" description="From a page view to a completed booking, platform-wide.">
            <FunnelChart data={funnelData} />
          </Panel>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Panel title="Most viewed pages">
            {topPages.length === 0 ? (
              <EmptyState title="No page views yet" />
            ) : (
              <ul className="divide-y divide-black/5 text-sm">
                {topPages.map((page) => (
                  <li key={page.path} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="min-w-0 truncate">{page.path}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{page.views.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Where visitors came from">
            {referrers.length === 0 ? (
              <EmptyState title="No data yet" />
            ) : (
              <ul className="divide-y divide-black/5 text-sm">
                {referrers.map((referrer) => (
                  <li key={referrer.source} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="min-w-0 truncate">{referrer.source}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{referrer.visits.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <Panel title="Browser">
            <BreakdownPie data={browsers} />
          </Panel>
          <Panel title="Operating system">
            <BreakdownPie data={operatingSystems} />
          </Panel>
          <Panel title="Device type">
            <BreakdownPie data={deviceTypes} />
          </Panel>
        </div>

        <Panel title="Top countries">
          {countries.length === 0 ? (
            <EmptyState title="No data yet" />
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 divide-y divide-black/5 text-sm sm:grid-cols-3">
              {countries.map((country) => (
                <li key={country.name} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="min-w-0 truncate">{country.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{country.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="New businesses" description="Signups per week, last 12 weeks.">
          <SignupsChart data={signupsByWeek} />
        </Panel>

        <Panel title="By business" description={`Visits and bookings per business, last ${days} days, most visited first.`}>
          {leaderboard.length === 0 ? (
            <EmptyState title="No traffic yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Business</th>
                    <th className="py-2 pr-4 font-medium">Visitors</th>
                    <th className="py-2 pr-4 font-medium">Page views</th>
                    <th className="py-2 pr-4 font-medium">Enquiries</th>
                    <th className="py-2 pr-4 font-medium">Bookings started</th>
                    <th className="py-2 pr-4 font-medium">Checkouts</th>
                    <th className="py-2 pr-4 font-medium">Bookings made</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {leaderboard.map((row) => (
                    <tr key={row.businessId}>
                      <td className="py-2.5 pr-4 font-medium">
                        {businessNameById.has(row.businessId) ? row.name : <Badge variant="outline">Unknown business</Badge>}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">{row.visitors.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{row.pageviews.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{row.enquiries.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{row.bookingsStarted.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{row.checkoutsStarted.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{row.bookingsCreated.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </PageBody>
    </>
  );
}
