"use client";

import { useState } from "react";
import {
  PLATFORM_REFERRAL_PAYOUT_METHODS,
  PLATFORM_REFERRAL_PAYOUT_METHOD_FIELDS,
  PLATFORM_REFERRAL_PAYOUT_METHOD_LABEL,
} from "@glamsite/shared/earn";
import { formatMoney } from "@glamsite/shared/format";
import type {
  PlatformReferral,
  PlatformReferralEarning,
  PlatformReferralPayoutDetails,
  PlatformReferralPayoutMethod,
  PlatformReferralStatus,
} from "@glamsite/shared/types";
import { EmptyState, Field, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/lib/use-action";
import { setPlatformReferralPayoutDetails, submitPlatformReferral } from "./actions";

const STATUS_LABEL: Record<PlatformReferralStatus, string> = {
  submitted: "Submitted",
  contacted: "Contacted",
  signed_up: "Signed up",
  active: "Active",
  lost: "Not proceeding",
};

function statusVariant(status: PlatformReferralStatus): "default" | "outline" {
  return status === "active" || status === "signed_up" ? "default" : "outline";
}

function ReferralForm() {
  const { pending, run } = useAction();
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  return (
    <Panel
      title="Refer a business"
      description="Know a salon, barber, nail bar, lash or brow studio, or makeup artist who'd like a site like yours? Tell us about them and we'll take it from there."
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          run(
            () => submitPlatformReferral({ businessName, contactName, contactEmail, contactPhone }),
            "Referral submitted",
            () => {
              setBusinessName("");
              setContactName("");
              setContactEmail("");
              setContactPhone("");
            }
          );
        }}
      >
        <Field id="earn-business-name" label="Business name">
          <Input id="earn-business-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
        </Field>
        <Field id="earn-contact-name" label="Contact name">
          <Input id="earn-contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
        </Field>
        <Field id="earn-contact-email" label="Contact email">
          <Input
            id="earn-contact-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />
        </Field>
        <Field id="earn-contact-phone" label="Contact phone" description="Optional">
          <Input id="earn-contact-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </Field>
        <Button type="submit" loading={pending} className="justify-self-start">
          {pending ? "Submitting…" : "Submit referral"}
        </Button>
      </form>
    </Panel>
  );
}

function ReferralsList({ referrals }: { referrals: PlatformReferral[] }) {
  return (
    <Panel title="Your referrals" description="We'll update the status as each one moves forward.">
      {referrals.length === 0 ? (
        <EmptyState title="No referrals yet">Submit a business above to start earning.</EmptyState>
      ) : (
        <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
          {referrals.map((referral) => (
            <li key={referral.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{referral.referredBusinessName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {referral.referredContactName} · {new Date(referral.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={statusVariant(referral.status)}>{STATUS_LABEL[referral.status]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function EarningsList({ earnings, currency }: { earnings: PlatformReferralEarning[]; currency: string }) {
  const totalCents = earnings.reduce((sum, earning) => sum + earning.commissionCents, 0);
  return (
    <Panel
      title="Earnings"
      description="15% of what each referred business pays us for hosting, recorded month by month."
      actions={
        earnings.length > 0 ? (
          <p className="text-sm font-medium">Total: {formatMoney(totalCents, currency)}</p>
        ) : undefined
      }
    >
      {earnings.length === 0 ? (
        <EmptyState title="No earnings yet">Once a referral signs up and pays for hosting, earnings show up here.</EmptyState>
      ) : (
        <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
          {earnings.map((earning) => (
            <li key={earning.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm text-muted-foreground">{earning.yearMonth}</p>
              <p className="font-medium">{formatMoney(earning.commissionCents, currency)}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function PayoutDetailsForm({ payoutDetails }: { payoutDetails: PlatformReferralPayoutDetails | null }) {
  const { pending, run } = useAction();
  const [method, setMethod] = useState<PlatformReferralPayoutMethod>(payoutDetails?.method ?? "bank_uk");
  const [accountName, setAccountName] = useState(payoutDetails?.accountName ?? "");
  const [identifier, setIdentifier] = useState(payoutDetails?.identifier ?? "");
  const [identifier2, setIdentifier2] = useState(payoutDetails?.identifier2 ?? "");
  const [notes, setNotes] = useState(payoutDetails?.notes ?? "");

  const fields = PLATFORM_REFERRAL_PAYOUT_METHOD_FIELDS[method];

  return (
    <Panel title="Payout details" description="Where we send your Earn commission. We pay out directly, not through Stripe -- pick whatever works wherever you bank.">
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          run(
            () => setPlatformReferralPayoutDetails({ method, accountName, identifier, identifier2, notes }),
            "Payout details saved"
          );
        }}
      >
        <Field id="earn-method" label="Payout method">
          <Select
            value={method}
            onValueChange={(value) => {
              setMethod(value as PlatformReferralPayoutMethod);
              setIdentifier2("");
            }}
          >
            <SelectTrigger className="w-full" id="earn-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_REFERRAL_PAYOUT_METHODS.map((value) => (
                <SelectItem key={value} value={value}>
                  {PLATFORM_REFERRAL_PAYOUT_METHOD_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="earn-account-name" label="Name on the account">
          <Input id="earn-account-name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
        </Field>
        <Field id="earn-identifier" label={fields.identifierLabel}>
          <Input id="earn-identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        </Field>
        {fields.identifier2Label ? (
          <Field id="earn-identifier-2" label={fields.identifier2Label}>
            <Input id="earn-identifier-2" value={identifier2} onChange={(e) => setIdentifier2(e.target.value)} />
          </Field>
        ) : null}
        <Field id="earn-notes" label="Notes" description="Anything else we should know, e.g. a different payee name.">
          <Textarea id="earn-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </Field>
        <Button type="submit" loading={pending} className="justify-self-start">
          {pending ? "Saving…" : "Save payout details"}
        </Button>
      </form>
    </Panel>
  );
}

export function EarnManager({
  currency,
  referrals,
  earnings,
  payoutDetails,
}: {
  currency: string;
  referrals: PlatformReferral[];
  earnings: PlatformReferralEarning[];
  payoutDetails: PlatformReferralPayoutDetails | null;
}) {
  return (
    <div className="grid gap-6">
      <ReferralForm />
      <ReferralsList referrals={referrals} />
      <EarningsList earnings={earnings} currency={currency} />
      <PayoutDetailsForm payoutDetails={payoutDetails} />
    </div>
  );
}
