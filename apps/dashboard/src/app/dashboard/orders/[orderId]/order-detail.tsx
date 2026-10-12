"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { OrderActionsMenu } from "@/components/dashboard/OrderActionsMenu";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatOrderDateTime,
  formatOrderMoney,
  formatOrderStatus,
  ORDER_STATUSES,
  shortOrderId,
  updateOrderStatus,
} from "@/lib/orders";
import { useSeller } from "@/lib/seller-context";
import { orderFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/client";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";
import type { Order, OrderStatus } from "@glamsite/shared/types";

export function OrderDetail({ orderId }: { orderId: string }) {
  const { seller } = useSeller();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<OrderStatus | null>(null);
  const sellerKey = seller?.id ?? null;

  useEffect(() => {
    if (!sellerKey || !isSupabaseConfigured()) {
      setOrder(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .eq("seller_id", sellerKey)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        setOrder(data ? orderFromRow(data) : null);
        setLoadError(null);
      } catch (err) {
        console.error("Failed to load order", err);
        if (!cancelled) {
          setLoadError("Could not load this order from Supabase.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, sellerKey]);

  async function applyStatus(next: OrderStatus) {
    if (!sellerKey || !order) return;
    setSavingStatus(next);
    setActionError(null);
    try {
      const updated = await updateOrderStatus(sellerKey, order, next);
      setOrder(updated);
    } catch (err) {
      console.error("Failed to update order status", err);
      setActionError("Could not update this order's status.");
    } finally {
      setSavingStatus(null);
    }
  }

  return (
    <div className="px-4 pt-6 pb-8 lg:px-6">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink-950"
      >
        <ChevronLeftIcon className="size-4" />
        Back to orders
      </Link>

      {loading ? <OrderDetailSkeleton /> : null}

      {!loading && loadError ? (
        <p className="mt-6 rounded-xl border border-black/8 bg-white px-5 py-4 text-sm text-muted-foreground shadow-card">
          {loadError}
        </p>
      ) : null}

      {!loading && !loadError && !order ? (
        <div className="mt-6 rounded-xl border border-black/8 bg-white px-5 py-16 text-center shadow-card">
          <p className="text-base font-medium text-ink-950">Order not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This order does not belong to your store, or it was removed.
          </p>
        </div>
      ) : null}

      {!loading && order ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-mono text-2xl font-bold tracking-tight text-ink-950">
                #{shortOrderId(order.id)}
              </h1>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{order.id}</p>
            </div>
            <OrderActionsMenu
              order={order}
              disabled={savingStatus !== null}
              onUpdated={setOrder}
              onError={(message) => setActionError(message || null)}
            />
          </div>

          {actionError ? <p className="text-sm text-delta-down">{actionError}</p> : null}

          <section className="rounded-xl border border-black/8 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-ink-950">Status</h2>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.status} />
                <Select
                  value={order.status}
                  disabled={savingStatus !== null}
                  onValueChange={(value) => {
                    if (value === order.status) return;
                    applyStatus(value as OrderStatus);
                  }}
                >
                  <SelectTrigger className="min-w-48 bg-white" aria-label="Order status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatOrderStatus(status)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-black/8 bg-white shadow-card">
            <div className="border-b border-black/6 px-5 py-4">
              <h2 className="text-sm font-medium text-ink-950">Items</h2>
            </div>
            {order.items.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">No items on this order.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/6 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={`${item.productId}-${index}`} className="border-b border-black/6 last:border-0">
                        <td className="px-5 py-3.5 font-medium text-ink-950">{item.name}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{item.quantity}</td>
                        <td className="px-5 py-3.5 text-right font-tabular text-ink-950">
                          {formatOrderMoney(item.priceCedis)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-black/6 px-5 py-4">
              <span className="text-sm font-medium text-ink-950">Subtotal</span>
              <span className="font-tabular text-sm font-medium text-ink-950">
                {formatOrderMoney(order.subtotalCedis)}
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-black/8 bg-white p-5 shadow-card">
            <h2 className="text-sm font-medium text-ink-950">Buyer</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailField label="Name" value={order.buyerName || "Not set"} />
              <DetailField label="Phone" value={order.buyerPhone || "Not set"} mono />
              <DetailField label="Delivery address" value={order.deliveryAddress || "Not set"} className="sm:col-span-2" />
              {order.paymentReference ? (
                <DetailField label="Payment reference" value={order.paymentReference} mono className="sm:col-span-2" />
              ) : null}
            </dl>
          </section>

          <section className="rounded-xl border border-black/8 bg-white p-5 shadow-card">
            <h2 className="text-sm font-medium text-ink-950">Timestamps</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <DetailField label="Created" value={formatOrderDateTime(order.createdAt)} />
              {order.packedAt ? (
                <DetailField label="Processing" value={formatOrderDateTime(order.packedAt)} />
              ) : null}
              {order.dispatchedAt ? (
                <DetailField label="In Transit" value={formatOrderDateTime(order.dispatchedAt)} />
              ) : null}
            </dl>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function DetailField({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={`mt-1 text-sm text-ink-950 ${mono ? "font-mono text-xs tracking-wide" : ""}`}>{value}</dd>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      <Skeleton className="h-8 w-40" />
      <div className="rounded-xl border border-black/8 bg-white p-5 shadow-card">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-4 h-8 w-36" />
      </div>
      <div className="rounded-xl border border-black/8 bg-white p-5 shadow-card">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </div>
    </div>
  );
}
