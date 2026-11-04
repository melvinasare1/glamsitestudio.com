"use client";

import { EMAIL_QUOTA_BY_TIER, HOSTING_TIER_LABEL, HOSTING_TIER_PRICE_CENTS, HOSTING_TIERS } from "@glamsite/shared/billing";
import { formatMoney } from "@glamsite/shared/format";
import type { HostingTier } from "@glamsite/shared/types";
import { Button } from "@/components/ui/button";
import { useAction } from "@/lib/use-action";
import { changeHostingTier } from "./actions";

export function PlanPicker({ currentTier, currency }: { currentTier: HostingTier; currency: string }) {
  const { pending, run } = useAction();

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {HOSTING_TIERS.map((tier) => {
        const active = tier === currentTier;
        return (
          <div
            key={tier}
            className={`rounded-xl border p-4 ${active ? "border-brand bg-brand/5" : "border-black/10"}`}
          >
            <p className="font-medium">{HOSTING_TIER_LABEL[tier]}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMoney(HOSTING_TIER_PRICE_CENTS[tier], currency)}/month · {EMAIL_QUOTA_BY_TIER[tier]} emails/month
            </p>
            <Button
              className="mt-3 w-full"
              variant={active ? "secondary" : "outline"}
              size="sm"
              disabled={active || pending}
              loading={pending}
              onClick={() => run(() => changeHostingTier(tier), `Switched to ${HOSTING_TIER_LABEL[tier]}`)}
            >
              {active ? "Current plan" : tier === "basic" ? "Downgrade" : "Switch"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
