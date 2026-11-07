import Link from "next/link";
import { CheckCircle2Icon, CircleIcon, MailIcon } from "lucide-react";
import { sectionText } from "@glamsite/shared/site-content";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader, Panel } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { AccountManagerPanel } from "./account-manager-panel";
import { confirmLaunchIfNeeded } from "./billing/actions";
import { PublishPanel } from "./publish-panel";

export const dynamic = "force-dynamic";

type Step = { done: boolean; title: string; body: string; href: string; essential: boolean };

type Props = { searchParams: { launched?: string; session_id?: string } };

export default async function OverviewPage({ searchParams }: Props) {
  // Right after the $1 launch redirect, confirm straight with Stripe before
  // reading billing status below, instead of trusting the webhook to have
  // landed by now (same reasoning as refreshConnectStatus on the billing
  // page). No-ops once already launched.
  if (searchParams.session_id) await confirmLaunchIfNeeded(searchParams.session_id);

  const { session, business } = await requireBusiness();
  const launched = session.billing?.subscriptionStatus === "active" || session.billing?.subscriptionStatus === "trialing";
  // Landed here with a session_id but still not launched: a delayed
  // payment method, or the webhook/our own check above both missed it for
  // some reason. Rare, but worth a distinct message instead of silently
  // showing "Launch your site" again as if nothing happened.
  const launchPending = Boolean(searchParams.session_id) && !launched;
  const supabase = await createClient();
  const count = async (table: "services" | "staff" | "opening_hours") =>
    (await supabase.from(table).select("id", { count: "exact", head: true }).eq("business_id", business.id)).count ?? 0;
  const [services, staff, hours, unread] = await Promise.all([
    count("services"),
    count("staff"),
    count("opening_hours"),
    supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("is_read", false)
      .then((result) => result.count ?? 0),
  ]);

  const steps: Step[] = [
    {
      done: Boolean(business.address.line1 && (business.phone || business.email)),
      title: "Add your address and contact details",
      body: "So clients can find and reach you.",
      href: "/details",
      essential: true,
    },
    {
      done: Boolean(sectionText(business.content, "hero", "headline") || sectionText(business.content, "hero", "image")),
      title: "Write your headline and add a main photo",
      body: "The first thing visitors see.",
      href: "/website",
      essential: true,
    },
    {
      done: services > 0,
      title: "Add your services and prices",
      body: services ? `${services} added.` : "Your price list.",
      href: "/services",
      essential: true,
    },
    {
      done: hours > 0,
      title: "Set your opening hours",
      body: "Shown in the Visit us section.",
      href: "/hours",
      essential: true,
    },
    {
      done: staff > 0,
      title: "Introduce your team",
      body: staff ? `${staff} added.` : "Optional, but clients love putting a face to a name.",
      href: "/team",
      essential: false,
    },
    {
      done: business.bookingMode !== "none",
      title: "Set up booking",
      body: "Optional. Take bookings on your site, or send Book buttons to Fresha, Booksy or similar.",
      href: "/booking",
      essential: false,
    },
  ];
  const ready = steps.filter((step) => step.essential).every((step) => step.done);
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <>
      <PageHeader title={`Welcome, ${business.name}`} />
      <PageBody>
        <PublishPanel ready={ready} launched={launched} pending={launchPending} />

        <Panel title="Set up your site" description={`${doneCount} of ${steps.length} done`}>
          <ul className="grid gap-1">
            {steps.map((step) => (
              <li key={step.href}>
                <Link href={step.href} className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-mist">
                  {step.done ? (
                    <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-delta-up" aria-label="Done" />
                  ) : (
                    <CircleIcon className="mt-0.5 size-5 shrink-0 text-black/20" aria-label="To do" />
                  )}
                  <span>
                    <span className={step.done ? "font-medium text-muted-foreground line-through" : "font-medium"}>
                      {step.title}
                    </span>
                    <span className="block text-sm text-muted-foreground">{step.body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Your account manager">
          <AccountManagerPanel />
        </Panel>

        <Panel
          title="Messages"
          actions={
            <Link href="/messages" className="text-sm font-medium text-brand">
              Open messages
            </Link>
          }
        >
          <p className="flex items-center gap-2 text-sm">
            <MailIcon className="size-4 text-muted-foreground" />
            {unread ? `${unread} unread message${unread === 1 ? "" : "s"}` : "No new messages"}
          </p>
        </Panel>
      </PageBody>
    </>
  );
}
