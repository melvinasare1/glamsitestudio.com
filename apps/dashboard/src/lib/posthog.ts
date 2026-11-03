/**
 * Server-side PostHog queries for the owner Analytics page. One PostHog
 * project holds events for every business on the platform (each event is
 * tagged with `business_id` by apps/web, see apps/web/src/lib/track.ts and
 * server-track.ts) — every query here filters to the signed-in owner's
 * business, the same scoping every Supabase query in this app already does.
 *
 * Uses PostHog's HogQL query endpoint directly via fetch rather than a
 * client library, since this is read-only and only runs server-side.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Defence in depth: businessId always comes from the owner's own session, never user input, but this is cheap insurance against ever interpolating something unexpected into HogQL. */
function assertBusinessId(businessId: string): string {
  if (!UUID_RE.test(businessId)) throw new Error("Invalid business id");
  return businessId;
}

type HogQLResponse = { results?: unknown[][]; columns?: string[] };

/** True once POSTHOG_HOST/PROJECT_ID/PERSONAL_API_KEY are all set; callers should show an empty state otherwise. */
export function isPostHogConfigured(): boolean {
  return Boolean(process.env.POSTHOG_HOST && process.env.POSTHOG_PROJECT_ID && process.env.POSTHOG_PERSONAL_API_KEY);
}

async function runHogQL(query: string): Promise<HogQLResponse | null> {
  if (!isPostHogConfigured()) return null;
  const host = process.env.POSTHOG_HOST;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  try {
    const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("[posthog] query failed", response.status, await response.text().catch(() => ""));
      return null;
    }
    return (await response.json()) as HogQLResponse;
  } catch (error) {
    console.error("[posthog] query failed", error);
    return null;
  }
}

export type VisitStats = { visitors: number; pageviews: number; enquiries: number; bookingsStarted: number; checkoutsStarted: number; bookingsCreated: number };

const EMPTY_STATS: VisitStats = { visitors: 0, pageviews: 0, enquiries: 0, bookingsStarted: 0, checkoutsStarted: 0, bookingsCreated: 0 };

/** Visit and funnel counts for one business over the last `days` days. */
export async function getVisitStats(businessId: string, days = 30): Promise<VisitStats> {
  const id = assertBusinessId(businessId);
  const result = await runHogQL(`
    select
      countIf(event = '$pageview') as pageviews,
      count(distinct person_id) as visitors,
      countIf(event = 'enquiry_submitted') as enquiries,
      countIf(event = 'booking_started') as bookings_started,
      countIf(event = 'checkout_started') as checkouts_started,
      countIf(event = 'booking_created') as bookings_created
    from events
    where properties.business_id = '${id}'
      and timestamp >= now() - interval ${days} day
  `);
  const row = result?.results?.[0];
  if (!row) return EMPTY_STATS;
  const [pageviews, visitors, enquiries, bookingsStarted, checkoutsStarted, bookingsCreated] = row as number[];
  return { pageviews: pageviews ?? 0, visitors: visitors ?? 0, enquiries: enquiries ?? 0, bookingsStarted: bookingsStarted ?? 0, checkoutsStarted: checkoutsStarted ?? 0, bookingsCreated: bookingsCreated ?? 0 };
}

export type TopPage = { path: string; views: number };

/** Most-viewed pages for one business over the last `days` days. */
export async function getTopPages(businessId: string, days = 30, limit = 10): Promise<TopPage[]> {
  const id = assertBusinessId(businessId);
  const result = await runHogQL(`
    select properties.$pathname as path, count() as views
    from events
    where event = '$pageview'
      and properties.business_id = '${id}'
      and timestamp >= now() - interval ${days} day
    group by path
    order by views desc
    limit ${limit}
  `);
  return (result?.results ?? []).map(([path, views]) => ({ path: String(path ?? "/"), views: Number(views ?? 0) }));
}

export type Referrer = { source: string; visits: number };

/** Where visitors came from, for one business over the last `days` days. */
export async function getReferrers(businessId: string, days = 30, limit = 10): Promise<Referrer[]> {
  const id = assertBusinessId(businessId);
  const result = await runHogQL(`
    select
      coalesce(nullIf(properties.$referring_domain, ''), 'Direct') as source,
      count(distinct person_id) as visits
    from events
    where event = '$pageview'
      and properties.business_id = '${id}'
      and timestamp >= now() - interval ${days} day
    group by source
    order by visits desc
    limit ${limit}
  `);
  return (result?.results ?? []).map(([source, visits]) => ({ source: String(source ?? "Direct"), visits: Number(visits ?? 0) }));
}
