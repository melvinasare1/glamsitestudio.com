import Link from "next/link";
import { CheckCircle2Icon, CircleIcon, MailIcon } from "lucide-react";
import { sectionText } from "@glamsite/shared/site-content";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader, Panel } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { PublishPanel } from "./publish-panel";

export const dynamic = "force-dynamic";

type Step = { done: boolean; title: string; body: string; href: string; essential: boolean };

export default async function OverviewPage() {
  const { business } = await requireBusiness();
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
      href: "/dashboard/details",
      essential: true,
    },
    {
      done: Boolean(sectionText(business.content, "hero", "headline") || sectionText(business.content, "hero", "image")),
      title: "Write your headline and add a main photo",
      body: "The first thing visitors see.",
      href: "/dashboard/website",
      essential: true,
    },
    {
      done: services > 0,
      title: "Add your services and prices",
      body: services ? `${services} added.` : "Your price list.",
      href: "/dashboard/services",
      essential: true,
    },
    {
      done: hours > 0,
      title: "Set your opening hours",
      body: "Shown in the Visit us section.",
      href: "/dashboard/hours",
      essential: true,
    },
    {
      done: staff > 0,
      title: "Introduce your team",
      body: staff ? `${staff} added.` : "Optional, but clients love putting a face to a name.",
      href: "/dashboard/team",
      essential: false,
    },
    {
      done: business.bookingMode === "link",
      title: "Connect your booking page",
      body: "Optional. Send Book buttons to Fresha, Booksy or similar.",
      href: "/dashboard/booking",
      essential: false,
    },
  ];
  const ready = steps.filter((step) => step.essential).every((step) => step.done);
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <>
      <PageHeader title={`Welcome, ${business.name}`} />
      <PageBody>
        <PublishPanel ready={ready} />

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

        <Panel
          title="Messages"
          actions={
            <Link href="/dashboard/messages" className="text-sm font-medium text-brand">
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
