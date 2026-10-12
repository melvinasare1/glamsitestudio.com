import { AdminBillingTable } from "@/components/dashboard/admin/AdminBillingTable";
import { loadAdminBillingQueue } from "@/lib/admin-billing";

export default async function AdminBillingPage() {
  let sellers: Awaited<ReturnType<typeof loadAdminBillingQueue>> = [];
  let loadError: string | null = null;

  try {
    sellers = await loadAdminBillingQueue();
  } catch (err) {
    console.error("Failed to load admin billing queue", err);
    loadError = "Could not load billing queue from Supabase.";
  }

  const overdue = sellers.filter((seller) => seller.subscriptionStatus === "overdue").length;
  const trialing = sellers.filter((seller) => seller.subscriptionStatus === "trialing").length;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="mx-4 lg:mx-6">
          <p className="text-sm text-muted-foreground">
            Match incoming MoMo payments to a seller&apos;s 6-digit reference, then mark them paid.
            This updates billing only — storefront status stays separate.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {overdue.toLocaleString("en-GH")} overdue · {trialing.toLocaleString("en-GH")} still on
            trial
          </p>
        </div>

        {loadError ? (
          <p className="mx-4 rounded-xl border border-wire bg-white px-5 py-4 text-sm text-muted-foreground lg:mx-6">
            {loadError}
          </p>
        ) : (
          <div className="mx-4 lg:mx-6">
            <AdminBillingTable sellers={sellers} />
          </div>
        )}
      </div>
    </div>
  );
}
