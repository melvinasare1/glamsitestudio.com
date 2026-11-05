import { HOSTING_TIER_LABEL, HOSTING_TIER_PRICE_CENTS } from "@glamsite/shared/billing";
import { businessFromRow, billingFromRow } from "@glamsite/shared/mappers";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { getTemplate } from "@glamsite/shared/templates";
import type { Business, BusinessBilling, BusinessStatus } from "@glamsite/shared/types";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageBody, PageHeader, Panel } from "@/components/page";

const STATUS_LABEL: Record<BusinessStatus, string> = {
  draft: "Draft",
  live: "Live",
  paused: "Paused",
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </dd>
    </div>
  );
}

function formatGbp(cents: number): string {
  return `£${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Top-level, cross-business view for platform staff (gated by requireAdmin()
 * in admin/layout.tsx). Reads with the service-role client, deliberately
 * bypassing the per-business RLS that every owner-facing query goes through.
 */
export default async function AdminOverviewPage() {
  const supabase = createAdminClient();

  const [{ data: businessRows, error: businessError }, { data: billingRows, error: billingError }] =
    await Promise.all([
      supabase.from("businesses").select("*").order("created_at", { ascending: false }),
      supabase.from("business_billing").select("*"),
    ]);
  if (businessError) console.error("[admin] businesses lookup failed", businessError.message);
  if (billingError) console.error("[admin] business_billing lookup failed", billingError.message);

  const businesses: Business[] = (businessRows ?? []).map(businessFromRow);
  const billingByBusinessId = new Map<string, BusinessBilling>(
    (billingRows ?? []).map((row) => {
      const billing = billingFromRow(row);
      return [billing.businessId, billing];
    })
  );

  const statusCounts: Record<BusinessStatus, number> = { draft: 0, live: 0, paused: 0 };
  for (const business of businesses) statusCounts[business.status]++;

  // Estimated MRR: hosting tier price for everyone with a running subscription.
  // Informational only — actual revenue (refunds, proration, failed payments) lives in Stripe.
  let estimatedMrrCents = 0;
  for (const billing of billingByBusinessId.values()) {
    if (billing.subscriptionStatus === "active" || billing.subscriptionStatus === "trialing") {
      estimatedMrrCents += HOSTING_TIER_PRICE_CENTS[billing.hostingTier];
    }
  }

  const templateCounts = new Map<string, number>();
  for (const business of businesses) {
    templateCounts.set(business.templateId, (templateCounts.get(business.templateId) ?? 0) + 1);
  }
  const popularTemplates = Array.from(templateCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([templateId, count]) => ({ templateId, name: getTemplate(templateId).name, count }));

  return (
    <>
      <PageHeader title="Admin overview" description="Top-level view across every business on the platform." />
      <PageBody className="max-w-6xl">
        <Panel title="Businesses">
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat label="Total" value={businesses.length} />
            <Stat label="Live" value={statusCounts.live} />
            <Stat label="Draft" value={statusCounts.draft} />
            <Stat label="Paused" value={statusCounts.paused} />
          </dl>
        </Panel>

        <Panel
          title="Estimated monthly revenue"
          description="Hosting subscription price for every business with an active or trialing subscription. Doesn't include Stripe Connect booking fees, refunds or one-off fees."
        >
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat label="Estimated MRR" value={formatGbp(estimatedMrrCents)} />
          </dl>
        </Panel>

        <Panel title="Template popularity">
          {popularTemplates.length === 0 ? (
            <EmptyState title="No businesses yet" />
          ) : (
            <ul className="divide-y divide-black/5 text-sm">
              {popularTemplates.map((item) => (
                <li key={item.templateId} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="min-w-0 truncate">{item.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{item.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="All businesses" description={`${businesses.length} total, newest first.`}>
          {businesses.length === 0 ? (
            <EmptyState title="No businesses yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Business</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Template</th>
                    <th className="py-2 pr-4 font-medium">Hosting</th>
                    <th className="py-2 pr-4 font-medium">Subscription</th>
                    <th className="py-2 pr-4 font-medium">Signed up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {businesses.map((business) => {
                    const billing = billingByBusinessId.get(business.id);
                    return (
                      <tr key={business.id}>
                        <td className="py-2.5 pr-4">
                          <p className="font-medium">{business.name || business.slug}</p>
                          <p className="text-xs text-muted-foreground">{business.email || business.slug}</p>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={business.status === "live" ? "default" : "outline"}>
                            {STATUS_LABEL[business.status]}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4">{getTemplate(business.templateId).name}</td>
                        <td className="py-2.5 pr-4">{billing ? HOSTING_TIER_LABEL[billing.hostingTier] : "—"}</td>
                        <td className="py-2.5 pr-4 capitalize">
                          {billing ? billing.subscriptionStatus.replace("_", " ") : "none"}
                        </td>
                        <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                          {business.createdAt ? new Date(business.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </PageBody>
    </>
  );
}
