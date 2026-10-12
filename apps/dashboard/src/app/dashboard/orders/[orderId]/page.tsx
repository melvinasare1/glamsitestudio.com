import type { Metadata } from "next";
import { OrderDetail } from "./order-detail";

export const metadata: Metadata = {
  title: "Order",
};

export default function OrderDetailPage({ params }: { params: { orderId: string } }) {
  return <OrderDetail orderId={params.orderId} />;
}
