"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSeller } from "@/lib/seller-context";
import { PLAN_LABELS } from "@/lib/billing";
import { templateLabel } from "@/lib/storefront-templates";
import {
  formatPublishMissingMessage,
  MAX_RETURN_POLICY_CHARS,
  missingPublishRequirements,
} from "@/lib/verify";
import { saveSellerReturnPolicy, submitSellerForReview } from "./actions";
import { VerificationDocuments } from "./verification-documents";

export default function VerifyPage() {
  const router = useRouter();
  const { seller } = useSeller();
  const [returnPolicy, setReturnPolicy] = useState("");
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!seller) return;
    setReturnPolicy(seller.returnPolicy);
  }, [seller]);

  const missing = useMemo(() => missingPublishRequirements(seller), [seller]);
  const submittedAt = seller?.verificationSubmittedAt;
  const isLive = seller?.status === "active";
  const canPublish = Boolean(seller) && !isLive && seller?.status !== "offboarded";

  const planLabel = seller
    ? `${PLAN_LABELS[seller.pricingTier]}, GHS ${seller.baseFeeCedis}/mo base`
    : "Not set";

  async function handleSavePolicy() {
    setSavingPolicy(true);
    setError(null);
    setSuccess(null);
    setPolicySaved(false);
    const result = await saveSellerReturnPolicy(returnPolicy);
    setSavingPolicy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPolicySaved(true);
    router.refresh();
  }

  async function handlePublish() {
    if (!seller) return;
    setError(null);
    setSuccess(null);

    if (missing.length > 0) {
      setError(formatPublishMissingMessage(missing));
      return;
    }

    setPublishing(true);
    const result = await submitSellerForReview(returnPolicy);
    setPublishing(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if (result.notifyWarning) {
      setSuccess(result.notifyWarning);
    } else if (result.alreadySubmitted) {
      setSuccess("Updated. We notified the review team of your latest details.");
    } else {
      setSuccess(
        "Submitted for review. Publishing does not make your store live — we will activate it after we check your details."
      );
    }
    router.refresh();
  }

  return (
    <div className="max-w-2xl px-4 py-4 md:py-6 lg:px-6">
      <p className="text-sm text-ink-700/50">
        Confirm your documents and store details, then publish when you are ready for review.
        Publishing does not make the storefront live — every seller is activated by hand.
      </p>

      {isLive ? (
        <p className="mt-4 rounded-lg border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-ink-950">
          Your store is already live. You can still update documents and your return policy here.
        </p>
      ) : submittedAt ? (
        <p className="mt-4 rounded-lg border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-ink-950">
          Submitted for review on {formatSubmittedAt(submittedAt)}. Status stays onboarding until we
          activate your store.
        </p>
      ) : null}

      <section className="mt-6 rounded-xl border border-wire bg-white p-6">
        <h2 className="font-display text-base font-semibold text-ink-950">Identity documents</h2>
        <p className="mt-2 text-sm text-ink-700/60">
          Files are stored privately and can only be viewed through a short-lived signed URL. Replace
          any file by uploading a new one.
        </p>
        <VerificationDocuments />
      </section>

      <section className="mt-6 rounded-xl border border-wire bg-white p-6">
        <h2 className="font-display text-base font-semibold text-ink-950">Returns policy</h2>
        <p className="mt-2 text-sm text-ink-700/60">
          Set your own return policy. Items that arrive damaged or not as described are always
          eligible for return regardless of your policy below.
        </p>
        <textarea
          rows={4}
          maxLength={MAX_RETURN_POLICY_CHARS}
          value={returnPolicy}
          onChange={(event) => {
            setReturnPolicy(event.target.value);
            setPolicySaved(false);
          }}
          placeholder="e.g. No returns on sale items. Full returns within 3 days for everything else."
          className="mt-4 w-full rounded-lg border border-wire px-4 py-3 text-sm outline-none focus:border-signal"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-700/40">
            {returnPolicy.trim().length}/{MAX_RETURN_POLICY_CHARS}
          </p>
          <button
            type="button"
            disabled={savingPolicy || !seller}
            onClick={() => void handleSavePolicy()}
            className="rounded-lg border border-wire px-3 py-1.5 text-sm font-medium text-ink-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingPolicy ? "Saving…" : policySaved ? "Saved" : "Save policy"}
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-wire bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-ink-950">Review before you go live</h2>
        <p className="mt-2 text-sm text-ink-700/60">
          These come from onboarding. Change them in Settings if something looks wrong.
        </p>
        <dl className="mt-4 divide-y divide-black/6 text-sm">
          <SummaryRow label="Business name" value={seller?.businessName || "Not set"} />
          <SummaryRow label="Mobile number" value={seller?.phone || "Not set"} />
          <SummaryRow
            label="MoMo payment number"
            value={
              seller?.momoPhone
                ? seller.momoPhone === seller.phone
                  ? `${seller.momoPhone} (same as mobile)`
                  : seller.momoPhone
                : "Not set"
            }
          />
          <SummaryRow
            label="Template"
            value={seller ? templateLabel(seller.template) : "Not set"}
          />
          <SummaryRow label="Plan" value={planLabel} />
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-wire bg-white p-6">
        <h2 className="font-display text-base font-semibold text-ink-950">Publish</h2>
        <p className="mt-2 text-sm text-ink-700/60">
          We will mark you as ready for review and email the team. Your store stays off until we
          activate it.
        </p>

        {missing.length > 0 && canPublish ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-700">
            {missing.map((item) => (
              <li key={item}>Still needed: {item}</li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-lg border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-ink-950">
            {success}
          </p>
        ) : null}

        <button
          type="button"
          disabled={!canPublish || publishing}
          onClick={() => void handlePublish()}
          className="mt-6 rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {publishing
            ? "Submitting…"
            : isLive
              ? "Already live"
              : submittedAt
                ? "Resubmit for review"
                : "Publish"}
        </button>
      </section>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-ink-950">{value}</dd>
    </div>
  );
}

function formatSubmittedAt(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
