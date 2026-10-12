import type { Customer, Order } from "@glamsite/shared/types";

export type CustomerWithStats = Customer & {
  orderCount: number;
  totalSpentCedis: number;
};

export function customersWithStats(
  customers: Customer[],
  orders: Order[]
): CustomerWithStats[] {
  const byCustomer = new Map<string, { count: number; spent: number }>();
  for (const order of orders) {
    if (!order.customerId) continue;
    const current = byCustomer.get(order.customerId) ?? { count: 0, spent: 0 };
    current.count += 1;
    current.spent += Number.isFinite(order.subtotalCedis) ? order.subtotalCedis : 0;
    byCustomer.set(order.customerId, current);
  }

  return customers.map((customer) => {
    const stats = byCustomer.get(customer.id) ?? { count: 0, spent: 0 };
    return {
      ...customer,
      orderCount: stats.count,
      totalSpentCedis: stats.spent,
    };
  });
}

export function orderItemsLabel(order: Order): string {
  if (order.items.length === 0) return "None";
  return order.items
    .map((item) => (item.quantity > 1 ? `${item.name} × ${item.quantity}` : item.name))
    .join(", ");
}
