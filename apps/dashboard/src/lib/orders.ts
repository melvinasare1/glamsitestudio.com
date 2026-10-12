import { orderFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/client";
import type { Order, OrderStatus } from "@glamsite/shared/types";
import { trackEvent } from "@/lib/vercel-track";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "packed",
  "dispatched",
  "delivered",
  "return_requested",
  "returned",
  "cancelled",
  "refunded",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Awaiting Payment",
  paid: "Paid",
  packed: "Processing",
  dispatched: "In Transit",
  delivered: "Delivered",
  return_requested: "Return Requested",
  returned: "Returned",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function canCancelOrder(status: OrderStatus): boolean {
  return status === "pending_payment" || status === "paid" || status === "packed" || status === "dispatched";
}

export function canRefundOrder(status: OrderStatus): boolean {
  return status !== "pending_payment" && status !== "refunded";
}

export function formatOrderStatus(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

export function formatOrderMoney(cedis: number): string {
  return `GHS ${cedis.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatOrderDateTime(ms: number | undefined): string {
  if (!ms) return "Not set";
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function shortOrderId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function orderItemCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

function statusUpdatePatch(order: Order, next: OrderStatus): Record<string, string> {
  const patch: Record<string, string> = { status: next };
  if (next === "packed") {
    patch.packed_at = order.packedAt ? new Date(order.packedAt).toISOString() : new Date().toISOString();
  }
  if (next === "dispatched") {
    patch.dispatched_at = order.dispatchedAt
      ? new Date(order.dispatchedAt).toISOString()
      : new Date().toISOString();
  }
  return patch;
}

export async function updateOrderStatus(
  sellerId: string,
  order: Order,
  next: OrderStatus
): Promise<Order> {
  if (!ORDER_STATUSES.includes(next)) {
    throw new Error("Unknown order status.");
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .update(statusUpdatePatch(order, next))
    .eq("id", order.id)
    .eq("seller_id", sellerId)
    .select("*")
    .single();

  if (error) throw error;
  const updated = orderFromRow(data);
  trackEvent("order_status_changed", { status: next });
  return updated;
}
