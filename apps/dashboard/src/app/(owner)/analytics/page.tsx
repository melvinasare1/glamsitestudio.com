import { EmptyState, PageBody, PageHeader, Panel } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { getReferrers, getTopPages, getVisitStats, isPostHogConfigured } from "@/lib/posthog";

export const dynamic = "force-dynamic";

const DAYS = 30;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</dd>
    </div>
  );
}

export default async function AnalyticsPage() {
  const { business } = await requireBusiness();

  if (!isPostHogConfigured()) {
    return (
      <>
        <PageHeader title="Analytics" />
        <PageBody>
          <Panel>
            <EmptyState title="Analytics isn't set up yet">Contact support to turn on visitor analytics for your site.</EmptyState>
          </Panel>
        </PageBody>
      </>
    );
  }

  const [stats, topPages, referrers] = await Promise.all([
    getVisitStats(business.id, DAYS),
    getTopPages(business.id, DAYS),
    getReferrers(business.id, DAYS),
  ]);

  const noTraffic = stats.visitors === 0 && stats.pageviews === 0;

  return (
    <>
      <PageHeader title="Analytics" description={`Last ${DAYS} days, from visitors on your site.`} />
      <PageBody>
        <Panel title="Traffic">
          {noTraffic ? (
            <EmptyState title="No visits yet">Once people start viewing your site, visits will show up here.</EmptyState>
          ) : (
            <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              <Stat label="Visitors" value={stats.visitors} />
              <Stat label="Page views" value={stats.pageviews} />
              <Stat label="Enquiries sent" value={stats.enquiries} />
              <Stat label="Bookings started" value={stats.bookingsStarted} />
              <Stat label="Checkouts started" value={stats.checkoutsStarted} />
              <Stat label="Bookings made" value={stats.bookingsCreated} />
            </dl>
          )}
        </Panel>

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
      </PageBody>
    </>
  );
}
