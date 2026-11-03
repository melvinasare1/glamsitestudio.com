import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { loadSite } from "@/lib/site";

type Props = { children: React.ReactNode; params: { slug: string } };

/**
 * Wraps every page for one salon's site (home, book, appointment) so
 * analytics starts once with the right business id, however the visitor
 * landed. `loadSite` is request-deduped (`cache()`), so on the home page
 * this costs nothing extra; on /book and /appointment it's one cheap extra
 * lookup by slug.
 */
export default async function SiteLayout({ children, params }: Props) {
  const data = await loadSite(params.slug);
  return <AnalyticsProvider businessId={data?.business.id ?? null}>{children}</AnalyticsProvider>;
}
