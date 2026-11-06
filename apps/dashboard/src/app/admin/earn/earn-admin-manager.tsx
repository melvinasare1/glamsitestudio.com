"use client";

import { useState } from "react";
import { formatMoney } from "@glamsite/shared/format";
import type { PlatformReferral, PlatformReferralEarning, PlatformReferralStatus } from "@glamsite/shared/types";
import { EmptyState, Field, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/lib/use-action";
import { recordPlatformReferralEarning, updatePlatformReferral } from "./actions";

const STATUSES: PlatformReferralStatus[] = ["submitted", "contacted", "signed_up", "active", "lost"];
const STATUS_LABEL: Record<PlatformReferralStatus, string> = {
  submitted: "Submitted",
  contacted: "Contacted",
  signed_up: "Signed up",
  active: "Active",
  lost: "Not proceeding",
};

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function ReferralCard({
  referral,
  businesses,
  referrerName,
}: {
  referral: PlatformReferral;
  businesses: { id: string; name: string }[];
  referrerName: string;
}) {
  const { pending, run } = useAction();
  const [status, setStatus] = useState<PlatformReferralStatus>(referral.status);
  const [referredBusinessId, setReferredBusinessId] = useState(referral.referredBusinessId ?? "");
  const [staffNotes, setStaffNotes] = useState(referral.staffNotes);

  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [grossAmount, setGrossAmount] = useState("");

  return (
    <li className="grid gap-4 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{referral.referredBusinessName}</p>
          <p className="text-sm text-muted-foreground">
            Referred by {referrerName} · {referral.referredContactName} ({referral.referredContactEmail}
            {referral.referredContactPhone ? `, ${referral.referredContactPhone}` : ""})
          </p>
        </div>
        <Badge variant={status === "active" || status === "signed_up" ? "default" : "outline"}>
          {STATUS_LABEL[referral.status]}
        </Badge>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => updatePlatformReferral({ id: referral.id, status, referredBusinessId, staffNotes }), "Referral updated");
        }}
      >
        <Field id={`status-${referral.id}`} label="Status">
          <Select value={status} onValueChange={(value) => setStatus(value as PlatformReferralStatus)}>
            <SelectTrigger className="w-full" id={`status-${referral.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id={`business-${referral.id}`} label="Linked business" description="Once they sign up">
          <Select value={referredBusinessId || "none"} onValueChange={(value) => setReferredBusinessId(value === "none" ? "" : value)}>
            <SelectTrigger className="w-full" id={`business-${referral.id}`}>
              <SelectValue placeholder="Not linked" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not linked</SelectItem>
              {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id={`notes-${referral.id}`} label="Staff notes">
          <Textarea id={`notes-${referral.id}`} value={staffNotes} onChange={(e) => setStaffNotes(e.target.value)} rows={1} />
        </Field>
        <Button type="submit" loading={pending} variant="outline" className="justify-self-start sm:col-span-3">
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>

      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const cents = Math.round(Number(grossAmount) * 100);
          run(
            () =>
              recordPlatformReferralEarning({
                referralId: referral.id,
                referrerBusinessId: referral.referrerBusinessId,
                yearMonth,
                grossCents: cents,
              }),
            "Earning recorded",
            () => setGrossAmount("")
          );
        }}
      >
        <Field id={`month-${referral.id}`} label="Month" description="YYYY-MM">
          <Input id={`month-${referral.id}`} value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
        </Field>
        <Field id={`gross-${referral.id}`} label="Hosting paid to us this month">
          <Input
            id={`gross-${referral.id}`}
            inputMode="decimal"
            placeholder="0.00"
            value={grossAmount}
            onChange={(e) => setGrossAmount(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={pending} size="sm">
          {pending ? "Saving…" : "Record 15% earning"}
        </Button>
      </form>
    </li>
  );
}

export function EarnAdminManager({
  referrals,
  earnings,
  businesses,
  referrerNameById,
}: {
  referrals: PlatformReferral[];
  earnings: PlatformReferralEarning[];
  businesses: { id: string; name: string }[];
  referrerNameById: Record<string, string>;
}) {
  const earningsByReferral = new Map<string, PlatformReferralEarning[]>();
  for (const earning of earnings) {
    const list = earningsByReferral.get(earning.referralId) ?? [];
    list.push(earning);
    earningsByReferral.set(earning.referralId, list);
  }

  return (
    <div className="grid gap-6">
      <Panel title="Pipeline" description={`${referrals.length} referral${referrals.length === 1 ? "" : "s"} total.`}>
        {referrals.length === 0 ? (
          <EmptyState title="No referrals yet" />
        ) : (
          <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
            {referrals.map((referral) => (
              <ReferralCard
                key={referral.id}
                referral={referral}
                businesses={businesses}
                referrerName={referrerNameById[referral.referrerBusinessId] ?? "Unknown business"}
              />
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="All recorded earnings" description="Every monthly commission entry, most recent first.">
        {earnings.length === 0 ? (
          <EmptyState title="No earnings recorded yet" />
        ) : (
          <ul className="divide-y divide-black/5 rounded-xl border border-black/5 text-sm">
            {earnings.map((earning) => {
              const referral = referrals.find((r) => r.id === earning.referralId);
              return (
                <li key={earning.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0 truncate">
                    {referral?.referredBusinessName ?? "Deleted referral"} · {earning.yearMonth}
                  </span>
                  <span className="shrink-0 font-medium">{formatMoney(earning.commissionCents, "GBP")}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
