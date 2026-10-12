import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { OverviewStats } from "@/lib/analytics";
import { formatOrderMoney } from "@/lib/orders";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  PercentIcon,
  ShoppingBagIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatDelta(delta: number | null): string | null {
  if (delta == null || !Number.isFinite(delta)) return null;
  return `${Math.abs(delta).toFixed(1)}%`;
}

export function SectionCards({ stats }: { stats: OverviewStats }) {
  const revenueEmpty = stats.revenueCedis === 0 && stats.revenuePreviousCedis === 0;
  const ordersEmpty = stats.orders === 0 && stats.ordersPrevious === 0;
  const impressionsEmpty = stats.impressions === 0 && stats.impressionsPrevious === 0;
  const conversionValue =
    stats.conversion == null ? "n/a" : `${stats.conversion.toFixed(1)}%`;

  const cards: {
    label: string;
    value: string;
    delta: number | null;
    icon: LucideIcon;
    comparison: string;
  }[] = [
    {
      label: "Revenue",
      value: formatOrderMoney(stats.revenueCedis),
      delta: revenueEmpty ? null : stats.revenueDelta,
      icon: WalletIcon,
      comparison: revenueEmpty
        ? "No orders in the last 7 days"
        : `vs. ${formatOrderMoney(stats.revenuePreviousCedis)} last period`,
    },
    {
      label: "Orders",
      value: stats.orders.toLocaleString("en-GH"),
      delta: ordersEmpty ? null : stats.ordersDelta,
      icon: ShoppingBagIcon,
      comparison: ordersEmpty
        ? "No orders in the last 7 days"
        : `vs. ${stats.ordersPrevious.toLocaleString("en-GH")} last period`,
    },
    {
      label: "Impressions",
      value: stats.impressions.toLocaleString("en-GH"),
      delta: impressionsEmpty ? null : stats.impressionsDelta,
      icon: EyeIcon,
      comparison: impressionsEmpty
        ? "No storefront views in the last 7 days"
        : `vs. ${stats.impressionsPrevious.toLocaleString("en-GH")} last period`,
    },
    {
      label: "Conversion rate",
      value: conversionValue,
      delta: stats.conversionDelta,
      icon: PercentIcon,
      comparison:
        stats.conversion == null
          ? "Needs storefront views to calculate"
          : stats.conversionPrevious == null
            ? "No views in the previous period"
            : `vs. ${stats.conversionPrevious.toFixed(1)}% last period`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const deltaLabel = formatDelta(card.delta);
        const positive = (card.delta ?? 0) >= 0;
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
              <div className="flex items-center gap-2.5">
                <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                  {card.value}
                </p>
                {deltaLabel ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                      positive
                        ? "bg-delta-up-soft text-delta-up"
                        : "bg-delta-down-soft text-delta-down"
                    )}
                  >
                    {positive ? (
                      <ArrowUpIcon className="size-3" />
                    ) : (
                      <ArrowDownIcon className="size-3" />
                    )}
                    {deltaLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{card.comparison}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
