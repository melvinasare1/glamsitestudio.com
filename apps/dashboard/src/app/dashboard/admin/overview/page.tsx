import Link from "next/link";
import {
  BadgeCheckIcon,
  Building2Icon,
  ClockIcon,
  TimerOffIcon,
  WalletIcon,
} from "lucide-react";
import { SignupTrendChart } from "@/components/dashboard/admin/SignupTrendChart";
import { TemplateUsageChart } from "@/components/dashboard/admin/TemplateUsageChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { formatOrderMoney } from "@/lib/orders";
import { loadPlatformOverview, type SignupWindowDays } from "@/lib/platform-overview";
import { cn } from "@/lib/utils";

function parseWindow(value: string | undefined): SignupWindowDays {
  return value === "90" ? 90 : 30;
}

function formatWhen(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPercent(value: number | null): string {
  if (value == null) return "—";
  return `${value}%`;
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const days = parseWindow(searchParams.days);
  let overview: Awaited<ReturnType<typeof loadPlatformOverview>> | null = null;
  let loadError: string | null = null;

  try {
    overview = await loadPlatformOverview(days);
  } catch (err) {
    console.error("Failed to load platform overview", err);
    loadError = "Could not load platform metrics from Supabase.";
  }

  const cards = overview
    ? [
        {
          label: "Active businesses",
          value: overview.activeBusinesses.toLocaleString("en-GH"),
          note: "status = active",
          icon: Building2Icon,
        },
        {
          label: "On 30-day free trial",
          value: overview.onTrial.toLocaleString("en-GH"),
          note: "subscription_status = trialing",
          icon: ClockIcon,
        },
        {
          label: "Trial ended, not paying",
          value: overview.trialExpiredUnpaid.toLocaleString("en-GH"),
          note: "subscription_status = overdue",
          icon: TimerOffIcon,
        },
        {
          label: "Pending review",
          value: overview.pendingReview.toLocaleString("en-GH"),
          note: "onboarding and submitted via Verify",
          icon: BadgeCheckIcon,
        },
        {
          label: "Monthly recurring revenue",
          value: formatOrderMoney(overview.mrrCedis),
          note: "base_fee_cedis where subscription_status = active",
          icon: WalletIcon,
        },
      ]
    : [];

  const conversionLabel =
    overview && overview.conversion.ended > 0
      ? `${overview.conversion.converted} of ${overview.conversion.ended} trials converted — ${formatPercent(overview.conversion.rate)}`
      : "No ended trials yet";

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <p className="mx-4 text-sm text-muted-foreground lg:mx-6">
          Platform metrics across every seller. Not visible to seller accounts.
        </p>

        {loadError ? (
          <p className="mx-4 rounded-xl border border-wire bg-white px-5 py-4 text-sm text-muted-foreground lg:mx-6">
            {loadError}
          </p>
        ) : null}

        {overview ? (
          <>
            <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.label}
                    className="gap-0 rounded-[16px] bg-white py-5 shadow-card ring-0"
                  >
                    <CardHeader className="flex flex-row items-start justify-between px-5">
                      <CardDescription className="text-sm">{card.label}</CardDescription>
                      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                        <Icon className="size-4" />
                      </span>
                    </CardHeader>
                    <CardContent className="mt-3 px-5">
                      <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                        {card.value}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{card.note}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
              <section className="rounded-xl border border-wire bg-white p-5">
                <h2 className="font-display text-base font-semibold text-ink-950">Tier breakdown</h2>
                {overview.totalSellers === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No sellers yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-black/6">
                    {overview.tiers.map((tier) => (
                      <li key={tier.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium text-ink-950">{tier.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {tier.count.toLocaleString("en-GH")}{" "}
                            {tier.count === 1 ? "seller" : "sellers"}
                            {tier.percent != null ? ` · ${formatPercent(tier.percent)}` : ""}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm tabular-nums text-ink-950">
                          {formatOrderMoney(tier.revenueCedis)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-wire bg-white p-5">
                <h2 className="font-display text-base font-semibold text-ink-950">Trial conversion</h2>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{conversionLabel}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {overview.conversion.converted.toLocaleString("en-GH")} converted ·{" "}
                  {overview.conversion.notConverted.toLocaleString("en-GH")} not converted ·{" "}
                  {overview.conversion.ended.toLocaleString("en-GH")} trials ended
                </p>
                <p className="mt-4 rounded-lg bg-mist px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  Converted = subscription_status active after the trial window. Not converted =
                  overdue. Mark payments on{" "}
                  <Link href="/dashboard/admin/billing" className="underline underline-offset-2">
                    Platform billing
                  </Link>
                  .
                </p>
                {overview.conversion.dataGap ? (
                  <p className="mt-2 rounded-lg bg-mist px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    {overview.conversion.dataGap}
                  </p>
                ) : null}
              </section>
            </div>

            <section className="mx-4 rounded-xl border border-wire bg-white p-5 lg:mx-6">
              <h2 className="font-display text-base font-semibold text-ink-950">
                Template usage (active sellers)
              </h2>
              {overview.templates.every((item) => item.count === 0) ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No active sellers on a template yet. Counts stay at zero until a store is approved.
                </p>
              ) : (
                <div className="mt-4 h-72">
                  <TemplateUsageChart data={overview.templates.map((item) => ({ label: item.label, count: item.count }))} />
                </div>
              )}
            </section>

            <section className="mx-4 rounded-xl border border-wire bg-white p-5 lg:mx-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base font-semibold text-ink-950">Signup trend</h2>
                <div className="flex gap-1.5">
                  {([30, 90] as const).map((window) => (
                    <Link
                      key={window}
                      href={
                        window === 30
                          ? "/dashboard/admin/overview"
                          : "/dashboard/admin/overview?days=90"
                      }
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm transition-colors",
                        days === window
                          ? "border border-black/8 bg-muted text-ink-950"
                          : "text-muted-foreground hover:text-ink-950"
                      )}
                    >
                      Last {window} days
                    </Link>
                  ))}
                </div>
              </div>
              {overview.signupSeries.every((point) => point.signups === 0) ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No signups in this window. The line stays flat until someone creates a store.
                </p>
              ) : (
                <div className="mt-4 h-72">
                  <SignupTrendChart data={overview.signupSeries} />
                </div>
              )}
            </section>

            <section className="mx-4 rounded-xl border border-wire bg-white p-5 lg:mx-6">
              <h2 className="font-display text-base font-semibold text-ink-950">Recent activity</h2>
              {overview.activity.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No seller activity yet.</p>
              ) : (
                <ol className="mt-4 divide-y divide-black/6">
                  {overview.activity.map((item, index) => (
                    <li key={`${item.at}-${item.title}-${item.detail}-${index}`} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm font-medium text-ink-950">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                        {formatWhen(item.at)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Status changes (approved, paused) are not logged on sellers yet, so this feed uses
                signup, Verify submit, and inferred trial start times.
              </p>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
