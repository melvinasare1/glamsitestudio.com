"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { OrderActionsMenu } from "@/components/dashboard/OrderActionsMenu";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatOrderDateTime,
  formatOrderMoney,
  orderItemCount,
  shortOrderId,
} from "@/lib/orders";
import { useSeller } from "@/lib/seller-context";
import { orderFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/client";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";
import type { Order } from "@glamsite/shared/types";

const PAGE_SIZE = 10;

function pageList(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  for (const page of sorted) {
    const prev = items[items.length - 1];
    if (typeof prev === "number" && page - prev > 1) items.push("ellipsis");
    items.push(page);
  }
  return items;
}

export default function OrdersPage() {
  const router = useRouter();
  const { seller } = useSeller();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const sellerKey = seller?.id ?? null;

  useEffect(() => {
    if (!sellerKey || !isSupabaseConfigured()) {
      setOrders([]);
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
          .eq("seller_id", sellerKey)
          .order("created_at", { ascending: false });
        if (cancelled) return;
        if (error) throw error;
        setOrders((data ?? []).map(orderFromRow));
        setLoadError(null);
      } catch (err) {
        console.error("Failed to load orders", err);
        if (!cancelled) {
          setLoadError("Could not load orders from Supabase.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sellerKey]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => orders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [orders, currentPage]
  );

  function replaceOrder(updated: Order) {
    setOrders((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  }

  return (
    <div className="px-4 pt-4 pb-8 md:pt-6 lg:px-6">
      <p className="text-sm text-muted-foreground">Every order placed on your storefront.</p>

      {loadError ? (
        <p className="mt-6 rounded-xl border border-black/8 bg-white px-5 py-4 text-sm text-muted-foreground shadow-card">
          {loadError}
        </p>
      ) : null}

      {actionError ? <p className="mt-4 text-sm text-delta-down">{actionError}</p> : null}

      {loading ? <OrdersTableSkeleton /> : null}

      {!loading && !loadError && orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-black/8 bg-white px-5 py-16 text-center shadow-card">
          <p className="text-base font-medium text-ink-950">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When a customer checks out on your storefront, their order will show up here.
          </p>
        </div>
      ) : null}

      {!loading && !loadError && orders.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-black/8 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-black/6 bg-muted/70 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Placed</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer border-b border-black/6 last:border-0 hover:bg-muted/40"
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-mono text-xs tracking-wide text-ink-950 hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        #{shortOrderId(order.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink-950">{order.buyerName || "Not set"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{orderItemCount(order)}</td>
                    <td className="px-4 py-3.5 font-tabular text-ink-950">
                      {formatOrderMoney(order.subtotalCedis)}
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {formatOrderDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={(event) => event.stopPropagation()}>
                      <OrderActionsMenu
                        order={order}
                        onUpdated={replaceOrder}
                        onError={(message) => setActionError(message || null)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-2 py-4">
            <button
              type="button"
              onClick={() => setPage((n) => Math.max(1, n - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-ink-950 disabled:text-muted-foreground"
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {pageList(currentPage, totalPages).map((item, index) =>
                item === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={cn(
                      "min-w-8 rounded-lg px-2 py-1.5 text-sm tabular-nums",
                      item === currentPage
                        ? "bg-muted font-medium text-ink-950"
                        : "text-muted-foreground hover:text-ink-950"
                    )}
                  >
                    {String(item).padStart(2, "0")}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-ink-950 disabled:text-muted-foreground"
            >
              Next
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OrdersTableSkeleton() {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-black/8 bg-white shadow-card">
      <div className="space-y-0">
        <div className="flex items-center gap-4 border-b border-black/6 bg-muted/70 px-4 py-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-black/6 px-4 py-3.5 last:border-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
