"use client";

import { useState } from "react";
import { currencySymbol } from "@glamsite/shared/format";
import type { ClientReferral } from "@glamsite/shared/types";
import { EmptyState, Field, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { centsToInput } from "@/lib/order";
import { useAction } from "@/lib/use-action";
import { setReferralReward } from "./actions";

function personLabel(name: string | null, email: string | null): string {
  return name?.trim() || email?.trim() || "Deleted client";
}

export function ReferralsManager({
  currency,
  rewardCents,
  referrals,
}: {
  currency: string;
  rewardCents: number | null;
  referrals: ClientReferral[];
}) {
  const { pending, run } = useAction();
  const [reward, setReward] = useState(centsToInput(rewardCents));
  const symbol = currencySymbol(currency);

  return (
    <div className="grid gap-6">
      <Panel
        title="Referral reward"
        description="Each client gets their own referral link from their booking confirmation. When someone they refer completes a first appointment, the referrer gets a one-time discount code by email."
      >
        <form
          className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => setReferralReward(reward), "Referral reward saved");
          }}
        >
          <Field
            id="ref-reward"
            label={`Reward amount (${symbol})`}
            description="Leave blank to turn the referral program off."
          >
            <Input
              id="ref-reward"
              inputMode="decimal"
              placeholder="0.00"
              value={reward}
              onChange={(event) => setReward(event.target.value)}
            />
          </Field>
          <Button type="submit" loading={pending}>{pending ? "Saving…" : "Save"}</Button>
        </form>
      </Panel>

      <Panel title="Referred clients" description="Everyone who's booked using a client's referral link.">
        {referrals.length === 0 ? (
          <EmptyState title="No referrals yet">
            Once a client books using someone's referral link, they'll show up here.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
            {referrals.map((referral) => (
              <li key={referral.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {personLabel(referral.referredName, referral.referredEmail)}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    Referred by {personLabel(referral.referrerName, referral.referrerEmail)} ·{" "}
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={referral.status === "rewarded" ? "default" : "outline"}>
                  {referral.status === "rewarded" ? "Rewarded" : "Pending first visit"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
