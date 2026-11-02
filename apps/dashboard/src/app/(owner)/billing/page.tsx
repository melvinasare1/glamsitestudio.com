import Link from "next/link";
import { EMAIL_QUOTA_BY_TIER, hasCampaignsAccess } from "@glamsite/shared/billing";
import { PageBody, PageHeader, Panel } from "@/components/page";
import { getDashboardSession } from "@/lib/business";
import { ConnectStripeButton } from "./connect-stripe-button";
import { EmailCampaignsPanel } from "./email-campaigns-panel";
import { EmailNotificationsForm } from "./email-notifications-form";
import { LaunchButton } from "./launch-button";
import { ManageBillingButton } from "./manage-billing-button";

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

const HOSTING_TIER_LABEL: Record<string, string> = { basic: "Basic", popular: "Popular", premium: "Premium" };

export default async function BillingPage() {
  const session = await getDashboardSession();
  const billing = session?.billing;
  const hostingTier = billing?.hostingTier ?? "basic";
  const launched = billing?.subscriptionStatus === "active" || billing?.subscriptionStatus === "trialing";
  return (
    <>
      <PageHeader title="Billing" />
      <PageBody>
        <Panel title="Your plan">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Design</dt>
              <dd className="font-medium">{billing?.designService === "done_for_you" ? "Done-for-you" : "DIY"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Hosting tier</dt>
              <dd className="font-medium">
                {HOSTING_TIER_LABEL[hostingTier]} · {EMAIL_QUOTA_BY_TIER[hostingTier]} emails/month
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{STATUS[billing?.subscriptionStatus ?? "none"]}</dd>
            </div>
          </dl>
          {launched ? (
            <>
              <p className="mt-5 text-sm text-muted-foreground">
                Manage your card and invoices on Stripe — it opens in the same tab and brings you back here. Want a
                bigger hosting tier or done-for-you design?{" "}
                <Link href="/support" className="font-medium text-brand underline-offset-4 hover:underline">
                  Get in touch
                </Link>{" "}
                for now.
              </p>
              <ManageBillingButton />
            </>
          ) : (
            <>
              <p className="mt-5 text-sm text-muted-foreground">
                Your site stays private until you launch it — $1 for your first month of Basic hosting. Upgrade to a
                bigger plan any time after you're live.
              </p>
              <LaunchButton />
            </>
          )}
        </Panel>

        <Panel title="Get paid for bookings">
          {billing?.stripeConnectChargesEnabled ? (
            <p className="text-sm text-muted-foreground">
              Connected — client deposits and payments go straight to your Stripe account.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {billing?.stripeConnectAccountId
                  ? "Onboarding isn't finished yet — Stripe still needs some details before you can accept payments."
                  : "Connect Stripe to accept deposits and payments when clients book online. Funds go straight to your account — we never hold your money."}
              </p>
              <ConnectStripeButton label={billing?.stripeConnectAccountId ? "Finish Stripe setup" : "Connect Stripe"} />
            </>
          )}
        </Panel>

        <EmailNotificationsForm
          settings={session?.emailNotificationSettings ?? null}
          sentCount={session?.emailUsage?.sentCount ?? 0}
          hostingTier={hostingTier}
        />

        {hasCampaignsAccess(hostingTier) ? <EmailCampaignsPanel /> : null}
      </PageBody>
    </>
  );
}
