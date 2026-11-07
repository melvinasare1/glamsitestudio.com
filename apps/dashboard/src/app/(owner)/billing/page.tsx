import { BOOKING_ADDON_PRICE_CENTS, EMAIL_QUOTA_BY_TIER, HOSTING_TIER_LABEL, hasCampaignsAccess } from "@glamsite/shared/billing";
import { formatMoney } from "@glamsite/shared/format";
import { PageBody, PageHeader, Panel } from "@/components/page";
import { getDashboardSession } from "@/lib/business";
import { refreshConnectStatus } from "./actions";
import { BookingAddonButton } from "./booking-addon-button";
import { ConnectStripeButton } from "./connect-stripe-button";
import { EmailCampaignsPanel } from "./email-campaigns-panel";
import { EmailNotificationsForm } from "./email-notifications-form";
import { LaunchButton } from "./launch-button";
import { ManageBillingButton } from "./manage-billing-button";
import { PlanPicker } from "./plan-picker";

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

type Props = { searchParams: { checkout?: string } };

export default async function BillingPage({ searchParams }: Props) {
  // Re-checks a pending Connect account straight with Stripe before reading
  // the session, instead of trusting the account.updated webhook to have
  // landed by now (see refreshConnectStatus's own comment for why).
  await refreshConnectStatus();
  const session = await getDashboardSession();
  const billing = session?.billing;
  const hostingTier = billing?.hostingTier ?? "basic";
  const launched = billing?.subscriptionStatus === "active" || billing?.subscriptionStatus === "trialing";
  return (
    <>
      <PageHeader title="Billing" />
      <PageBody>
        {searchParams.checkout === "cancelled" && !launched ? (
          <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Payment wasn&apos;t completed &mdash; nothing was charged. Launch whenever you&apos;re ready.
          </div>
        ) : null}
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
                Manage your card and invoices on Stripe. It opens in the same tab and brings you back here.
              </p>
              <ManageBillingButton />
            </>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              Your site stays private until you launch it. $1 for your first 3 months, on whichever plan you pick
              below.
            </p>
          )}
        </Panel>

        <Panel
          title="Choose your plan"
          description={
            launched
              ? "Changes apply right away; your next invoice is prorated."
              : "Pick a plan, then launch below. The $1-for-3-months promo applies either way."
          }
        >
          <PlanPicker currentTier={hostingTier} currency="usd" />
          {!launched ? (
            <div className="mt-5">
              <LaunchButton />
            </div>
          ) : null}
        </Panel>

        <Panel
          title="Booking add-on"
          description={`${formatMoney(BOOKING_ADDON_PRICE_CENTS, "usd")}/month on top of hosting. Required for Glam Site booking on your site.`}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {billing?.bookingAddon
                ? "On. Clients can book services, staff and times on your site."
                : launched
                  ? "Off. Turn it on here, then choose Glam Site booking on the Booking page."
                  : "Launch your site first, then add this from here."}
            </p>
            <BookingAddonButton active={billing?.bookingAddon ?? false} launched={launched} />
          </div>
        </Panel>

        <Panel title="Get paid for bookings">
          {billing?.stripeConnectChargesEnabled ? (
            <p className="text-sm text-muted-foreground">
              Connected. Client deposits and payments go straight to your Stripe account.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {billing?.stripeConnectAccountId
                  ? "Onboarding isn't finished yet. Stripe still needs some details before you can accept payments."
                  : "Connect Stripe to accept deposits and payments when clients book online. Funds go straight to your account. We never hold your money."}
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
