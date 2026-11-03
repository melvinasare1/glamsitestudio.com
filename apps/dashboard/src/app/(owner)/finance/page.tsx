import Link from "next/link";
import { appointmentFromRow } from "@glamsite/shared/mappers";
import { formatMoney } from "@glamsite/shared/format";
import { createClient } from "@glamsite/shared/supabase/server";
import { EmptyState, PageBody, PageHeader, Panel } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { summarizeFinance, topCustomers } from "@/lib/finance";

export const dynamic = "force-dynamic";

const RANGES = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
];

type Props = { searchParams: { range?: string } };

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default async function FinancePage({ searchParams }: Props) {
  const { business } = await requireBusiness();
  const days = RANGES.some((item) => String(item.days) === searchParams.range) ? Number(searchParams.range) : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, clients(name, email, phone)")
    .eq("business_id", business.id)
    .gte("starts_at", since)
    .order("starts_at");
  if (error) console.error("[finance] load failed", error.message);

  const appointments = (data ?? []).map(appointmentFromRow);
  const summary = summarizeFinance(appointments, business.taxRatePercent);
  const customers = topCustomers(appointments);
  const money = (cents: number) => formatMoney(cents, summary.currency);

  return (
    <>
      <PageHeader
        title="Finance"
        description="From appointments only — product sales aren't tracked yet."
        actions={
          <div className="flex gap-1 rounded-lg border border-black/10 bg-white p-1">
            {RANGES.map((item) => (
              <Link
                key={item.days}
                href={{ query: { range: item.days } }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  item.days === days ? "bg-mist text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        }
      />
      <PageBody className="max-w-6xl">
        {summary.count === 0 ? (
          <Panel>
            <EmptyState title="No appointments in this period">Revenue and other figures will show up here once you have bookings.</EmptyState>
          </Panel>
        ) : (
          <>
            <Panel title="Revenue">
              <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                <Stat label="Booking revenue" value={money(summary.revenueCents)} hint={`${summary.count} appointments, after discounts`} />
                <Stat label="Collected online" value={money(summary.collectedCents)} hint="Via Stripe deposits/payments" />
                <Stat label="Platform fee" value={money(summary.platformFeeCents)} hint="At today's rate — see note below" />
                <Stat label="Discounts given" value={money(summary.discountCents)} />
                <Stat label="Refunds" value={money(summary.refundCents)} />
                <Stat label="Net to you" value={money(summary.netCents)} hint="Collected online, minus fees and refunds" />
              </dl>
              <p className="mt-5 text-xs text-muted-foreground">
                Platform fee is recalculated at today's rate for every appointment in this period, not the rate that applied when each
                one was booked, so it's an estimate if that rate has changed. "Net to you" only covers payments collected through your
                connected Stripe account — anything a client paid you directly (cash, card machine) isn't included.
              </p>
            </Panel>

            <Panel
              title="Tax (estimated)"
              description="A general estimate from your tax rate in Business details. Not applied to any payment — for your own reference only."
            >
              {business.taxRatePercent == null ? (
                <p className="text-sm text-muted-foreground">
                  <Link href="/details" className="font-medium text-brand underline-offset-4 hover:underline">
                    Set a tax rate
                  </Link>{" "}
                  to see an estimate here.
                </p>
              ) : (
                <Stat label={`At ${business.taxRatePercent}% of revenue`} value={money(summary.estimatedTaxCents)} />
              )}
            </Panel>

            <Panel title="Top customers" description="By booking value after discounts, this period.">
              {customers.length === 0 ? (
                <EmptyState title="No customers yet" />
              ) : (
                <ul className="divide-y divide-black/5 text-sm">
                  {customers.map((customer) => (
                    <li key={customer.clientId} className="flex items-center justify-between gap-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{customer.name || "Client removed"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {customer.email || "No email"} · {customer.visits} {customer.visits === 1 ? "visit" : "visits"}
                        </p>
                      </div>
                      <span className="shrink-0 tabular-nums">{money(customer.spendCents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </>
        )}
      </PageBody>
    </>
  );
}
