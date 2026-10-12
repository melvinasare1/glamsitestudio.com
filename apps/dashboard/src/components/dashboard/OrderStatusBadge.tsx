import { Badge } from "@/components/ui/badge";
import { formatOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@glamsite/shared/types";

const statusStyles: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-blue-50 text-blue-700 border-blue-200",
  packed: "bg-violet-50 text-violet-700 border-violet-200",
  dispatched: "bg-orange-50 text-orange-700 border-orange-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  return_requested: "bg-red-50 text-red-700 border-red-200",
  returned: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-sky-50 text-sky-800 border-sky-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {formatOrderStatus(status)}
    </Badge>
  );
}
