import type { SupabaseClient } from "@supabase/supabase-js";
import { orderFromRow } from "@glamsite/shared/mappers";
import type { OrderStatus } from "@glamsite/shared/types";
import { formatOrderDateTime, formatOrderMoney, orderItemCount } from "@/lib/orders";

export type DashboardOrder = {
  id: string;
  buyer: string;
  items: number;
  amount: string;
  status: OrderStatus;
  date: string;
};

export async function getRecentDashboardOrders(
  supabase: SupabaseClient,
  sellerId: string,
  limit = 5
): Promise<DashboardOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const order = orderFromRow(row);
    return {
      id: order.id,
      buyer: order.buyerName.trim() || "Not set",
      items: orderItemCount(order),
      amount: formatOrderMoney(order.subtotalCedis),
      status: order.status,
      date: formatOrderDateTime(order.createdAt),
    };
  });
}
