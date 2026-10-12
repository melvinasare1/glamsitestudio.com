import type { Metadata } from "next";
import { CustomerDetail } from "./customer-detail";

export const metadata: Metadata = {
  title: "Customer",
};

export default function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  return <CustomerDetail customerId={params.customerId} />;
}
