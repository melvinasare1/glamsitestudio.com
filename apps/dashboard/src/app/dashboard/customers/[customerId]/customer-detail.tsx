"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { orderItemsLabel } from "@/lib/customers";
import { formatOrderDateTime, formatOrderMoney, shortOrderId } from "@/lib/orders";
import { useSeller } from "@/lib/seller-context";
import { customerFromRow, orderFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/client";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";
import type { Customer, Order } from "@glamsite/shared/types";

export function CustomerDetail({ customerId }: { customerId: string }) {
  const { seller } = useSeller();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sellerKey = seller?.id ?? null;

  useEffect(() => {
    if (!sellerKey || !isSupabaseConfigured()) {
      setCustomer(null);
      setOrders([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const supabase = createClient();
        const [customerRes, ordersRes] = await Promise.all([
          supabase
            .from("customers")
            .select("*")
            .eq("id", customerId)
            .eq("seller_id", sellerKey)
            .maybeSingle(),
          supabase
            .from("orders")
            .select("*")
            .eq("customer_id", customerId)
            .eq("seller_id", sellerKey)
            .order("created_at", { ascending: false }),
        ]);
        if (cancelled) return;
        if (customerRes.error) throw customerRes.error;
        if (ordersRes.error) throw ordersRes.error;

        setCustomer(customerRes.data ? customerFromRow(customerRes.data) : null);
        setOrders((ordersRes.data ?? []).map(orderFromRow));
        setLoadError(null);
      } catch (err) {
        console.error("Failed to load customer", err);
        if (!cancelled) {
          setLoadError("Could not load this customer from Supabase.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [customerId, sellerKey]);

  const totalSpentCedis = orders.reduce(
    (sum, order) => sum + (Number.isFinite(order.subtotalCedis) ? order.subtotalCedis : 0),
    0
  );

  return (
    <div className="px-4 pt-6 pb-8 lg:px-6">
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink-950"
      >
        <ChevronLeftIcon className="size-4" />
        Back to customers
      </Link>

      {loading ? <CustomerDetailSkeleton /> : null}

      {!loading && loadError ? (
        <p className="mt-6 rounded-xl border border-black/8 bg-white px-5 py-4 text-sm text-muted-foreground shadow-card">
          {loadError}
        </p>
      ) : null}

      {!loading && !loadError && !customer ? (
        <div className="mt-6 rounded-xl border border-black/8 bg-white px-5 py-16 text-center shadow-card">
          <p className="text-base font-medium text-ink-950">Customer not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This customer does not belong to your store, or they were removed.
          </p>
        </div>
      ) : null}

      {!loading && customer ? (
        <div className="mt-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-950">
              {customer.name || customer.email || "Customer"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
              {orders.length > 0 ? ` · ${formatOrderMoney(totalSpentCedis)} spent` : ""}
            </p>
          </div>

          <section className="rounded-xl border border-black/8 bg-white p-5 shadow-card">
            <h2 className="text-sm font-medium text-ink-950">Profile</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailField label="Name" value={customer.name || "Not set"} />
              <DetailField label="Email" value={customer.email || "Not set"} />
              <DetailField label="Phone" value={customer.phone || "Not set"} mono />
              <DetailField
                label="Delivery address"
                value={customer.deliveryAddress || "Not set"}
                className="sm:col-span-2"
              />
            </dl>
          </section>

          <section className="rounded-xl border border-black/8 bg-white shadow-card">
            <div className="border-b border-black/6 px-5 py-4">
              <h2 className="text-sm font-medium text-ink-950">Orders</h2>
            </div>
            {orders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">No orders on file for this customer.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-black/6 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      <th className="px-5 py-3">Order</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Items</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const items = orderItemsLabel(order);
                      return (
                        <tr key={order.id} className="border-b border-black/6 last:border-0">
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/dashboard/orders/${order.id}`}
                              className="font-mono text-xs tracking-wide text-ink-950 hover:underline"
                            >
                              #{shortOrderId(order.id)}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">
                            {formatOrderDateTime(order.createdAt)}
                          </td>
                          <td className="max-w-[280px] truncate px-5 py-3.5 text-muted-foreground" title={items}>
                            {items}
                          </td>
                          <td className="px-5 py-3.5 font-tabular text-ink-950">
                            {formatOrderMoney(order.subtotalCedis)}
                          </td>
                          <td className="px-5 py-3.5">
                            <OrderStatusBadge status={order.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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

function CustomerDetailSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-xl border border-black/8 bg-white p-5 shadow-card">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </div>
      <div className="rounded-xl border border-black/8 bg-white p-5 shadow-card">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </div>
    </div>
  );
}
