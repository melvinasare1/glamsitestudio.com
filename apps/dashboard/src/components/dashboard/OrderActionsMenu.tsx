"use client";

import { useState } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canCancelOrder, canRefundOrder, updateOrderStatus } from "@/lib/orders";
import { useSeller } from "@/lib/seller-context";
import type { Order } from "@glamsite/shared/types";

const REFUND_NOTE =
  "This only marks the order as refunded in Glam Site Studios. It does not send money back. MoMo refunds are handled by you outside this system.";

type PendingAction = "cancel" | "refund";

export function OrderActionsMenu({
  order,
  disabled,
  onUpdated,
  onError,
}: {
  order: Order;
  disabled?: boolean;
  onUpdated: (order: Order) => void;
  onError: (message: string) => void;
}) {
  const { seller } = useSeller();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [saving, setSaving] = useState(false);
  const sellerId = seller?.id;
  const allowCancel = canCancelOrder(order.status);
  const allowRefund = canRefundOrder(order.status);

  async function confirm() {
    if (!pending || !sellerId) return;
    setSaving(true);
    onError("");
    try {
      const updated = await updateOrderStatus(
        sellerId,
        order,
        pending === "cancel" ? "cancelled" : "refunded"
      );
      onUpdated(updated);
      setPending(null);
    } catch (err) {
      console.error("Failed to update order", err);
      onError(pending === "cancel" ? "Could not cancel this order." : "Could not mark this order as refunded.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          aria-label={`Actions for order ${order.id}`}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-ink-950 disabled:opacity-50"
        >
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem
            variant="destructive"
            disabled={!allowCancel}
            onSelect={() => setPending("cancel")}
          >
            Cancel order
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!allowRefund} onSelect={() => setPending("refund")}>
            Refund order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {pending ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4"
          onClick={() => (saving ? null : setPending(null))}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-action-title"
            className="w-full max-w-sm rounded-xl border border-black/8 bg-white p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="order-action-title" className="text-lg font-semibold text-ink-950">
              {pending === "cancel" ? "Cancel order" : "Refund order"}
            </h2>
            {pending === "cancel" ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Cancel this order? This cannot be undone from the dashboard.
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{REFUND_NOTE}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setPending(null)}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-ink-950"
              >
                Go back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={confirm}
                className="rounded-full bg-delta-down px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving
                  ? pending === "cancel"
                    ? "Cancelling…"
                    : "Saving…"
                  : pending === "cancel"
                    ? "Cancel order"
                    : "Mark as refunded"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
