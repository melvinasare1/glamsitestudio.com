import { PageBody, PageHeader, Panel } from "@/components/page";
import { getDashboardSession } from "@/lib/business";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  none: "Not started",
  trialing: "Trial",
  active: "Active",
  past_due: "Payment overdue",
  canceled: "Cancelled",
  unpaid: "Unpaid",
  incomplete: "Incomplete",
};

/** Placeholder until Stripe Billing and the Customer Portal arrive in stage 3. */
export default async function BillingPage() {
  const session = await getDashboardSession();
  const billing = session?.billing;
  return (
    <>
      <PageHeader title="Billing" />
      <PageBody>
        <Panel title="Your plan">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="font-medium">{billing?.plan === "done_for_you" ? "Done-for-you" : "DIY"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Hosting</dt>
              <dd className="font-medium">{STATUS[billing?.subscriptionStatus ?? "none"]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Online booking</dt>
              <dd className="font-medium">{billing?.bookingAddon ? "On" : "Off"}</dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-muted-foreground">
            Card payments, invoices and plan changes will be managed here soon.
          </p>
        </Panel>
      </PageBody>
    </>
  );
}
