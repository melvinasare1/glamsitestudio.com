"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { markSellerSubscriptionPaid } from "@/app/dashboard/admin/billing/actions";
import type { AdminBillingSeller } from "@/lib/admin-billing";
import { formatOrderMoney } from "@/lib/orders";
import { cn } from "@/lib/utils";

function formatTrialEnd(ms: number | null): string {
  if (ms == null) return "—";
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminBillingTable({ sellers }: { sellers: AdminBillingSeller[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmPaid(seller: AdminBillingSeller) {
    const label = seller.businessName;
    const amount = formatOrderMoney(seller.baseFeeCedis);
    const ok = window.confirm(
      `Mark ${label} as paid for ${amount}?\n\nReference: ${seller.billingReference}\nThis records a billing payment and sets subscription_status to active.`
    );
    if (!ok) return;

    setPendingId(seller.id);
    startTransition(async () => {
      const result = await markSellerSubscriptionPaid(seller.id);
      setPendingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${label} marked as paid.`);
      router.refresh();
    });
  }

  if (sellers.length === 0) {
    return (
      <p className="rounded-xl border border-wire bg-white px-5 py-8 text-sm text-muted-foreground">
        No sellers are trialing or overdue right now.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-wire bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-black/6 bg-mist/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Business</th>
            <th className="px-4 py-3 font-medium">Reference</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Billing</th>
            <th className="px-4 py-3 font-medium">Trial ends</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-black/6">
          {sellers.map((seller) => {
            const busy = isPending && pendingId === seller.id;
            return (
              <tr key={seller.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-950">{seller.businessName}</p>
                  <p className="text-xs text-muted-foreground">{seller.email || "—"}</p>
                </td>
                <td className="px-4 py-3 font-mono text-base tracking-wider text-ink-950">
                  {seller.billingReference}
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink-950">{seller.planLabel}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatOrderMoney(seller.baseFeeCedis)}/mo
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      seller.subscriptionStatus === "overdue"
                        ? "bg-delta-down-soft text-delta-down"
                        : "bg-brand-soft text-brand"
                    )}
                  >
                    {seller.subscriptionStatus === "overdue" ? "Overdue" : "Trialing"}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {formatTrialEnd(seller.trialEndsAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirmPaid(seller)}
                    className="rounded-full bg-brand px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Mark as paid"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
