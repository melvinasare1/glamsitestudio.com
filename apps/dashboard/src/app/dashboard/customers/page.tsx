"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { customersWithStats, type CustomerWithStats } from "@/lib/customers";
import { formatOrderMoney } from "@/lib/orders";
import { useSeller } from "@/lib/seller-context";
import { customerFromRow, orderFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/client";
import { isSupabaseConfigured } from "@glamsite/shared/supabase/env";

export default function CustomersPage() {
  const router = useRouter();
  const { seller } = useSeller();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sellerKey = seller?.id ?? null;

  useEffect(() => {
    if (!sellerKey || !isSupabaseConfigured()) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const supabase = createClient();
        const [customersRes, ordersRes] = await Promise.all([
          supabase
            .from("customers")
            .select("*")
            .eq("seller_id", sellerKey)
            .order("created_at", { ascending: false }),
          supabase.from("orders").select("*").eq("seller_id", sellerKey),
        ]);
        if (cancelled) return;
        if (customersRes.error) throw customersRes.error;
        if (ordersRes.error) throw ordersRes.error;

        setCustomers(
          customersWithStats(
            (customersRes.data ?? []).map(customerFromRow),
            (ordersRes.data ?? []).map(orderFromRow)
          )
        );
        setLoadError(null);
      } catch (err) {
        console.error("Failed to load customers", err);
        if (!cancelled) {
          setLoadError("Could not load customers from Supabase.");
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

  return (
    <div className="px-4 pt-4 pb-8 md:pt-6 lg:px-6">
      <p className="text-sm text-muted-foreground">Everyone who&apos;s bought from your storefront.</p>

      {loadError ? (
        <p className="mt-6 rounded-xl border border-black/8 bg-white px-5 py-4 text-sm text-muted-foreground shadow-card">
          {loadError}
        </p>
      ) : null}

      {loading ? <CustomersTableSkeleton /> : null}

      {!loading && !loadError && customers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-black/8 bg-white px-5 py-16 text-center shadow-card">
          <p className="text-base font-medium text-ink-950">No customers yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When someone checks out on your storefront, they&apos;ll show up here.
          </p>
        </div>
      ) : null}

      {!loading && !loadError && customers.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-black/8 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-black/6 bg-muted/70 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Total spent</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer border-b border-black/6 last:border-0 hover:bg-muted/40"
                    onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                  >
                    <td className="px-4 py-3.5 font-medium text-ink-950">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {customer.name || "Not set"}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{customer.email || "Not set"}</td>
                    <td className="px-4 py-3.5 font-mono text-xs tracking-wide text-muted-foreground">
                      {customer.phone || "Not set"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{customer.orderCount}</td>
                    <td className="px-4 py-3.5 font-tabular text-ink-950">
                      {formatOrderMoney(customer.totalSpentCedis)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CustomersTableSkeleton() {
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
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
