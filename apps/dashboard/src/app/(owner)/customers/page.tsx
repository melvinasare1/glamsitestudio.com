import { clientFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { CustomersManager, type ClientVisit } from "./customers-manager";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();
  const [clients, appointments] = await Promise.all([
    supabase.from("clients").select("*").eq("business_id", business.id).order("name"),
    supabase
      .from("appointments")
      .select("client_id, service_name, starts_at, status, price_cents, currency")
      .eq("business_id", business.id)
      .not("client_id", "is", null)
      .order("starts_at", { ascending: false }),
  ]);
  for (const result of [clients, appointments]) {
    if (result.error) console.error("[customers] load failed", result.error.message);
  }

  // Grouped here rather than with a join, so one appointments query covers every client.
  const visitsByClient: Record<string, ClientVisit[]> = {};
  for (const row of appointments.data ?? []) {
    const clientId = row.client_id as string | null;
    if (!clientId) continue;
    (visitsByClient[clientId] ??= []).push({
      serviceName: row.service_name as string,
      startsAt: row.starts_at as string,
      status: row.status as string,
      priceCents: row.price_cents as number | null,
      currency: row.currency as string,
    });
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who's booked with you. Added automatically; no signup needed from them."
      />
      <PageBody className="max-w-4xl">
        <CustomersManager clients={(clients.data ?? []).map(clientFromRow)} visitsByClient={visitsByClient} />
      </PageBody>
    </>
  );
}
