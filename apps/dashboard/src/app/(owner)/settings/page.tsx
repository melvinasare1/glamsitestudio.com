import Link from "next/link";
import { ChevronRightIcon, ClockIcon, CreditCardIcon, FileTextIcon, type LucideIcon } from "lucide-react";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";

export const dynamic = "force-dynamic";

type SettingsLink = { href: string; title: string; description: string; icon: LucideIcon };

const LINKS: SettingsLink[] = [
  { href: "/hours", title: "Business hours", description: "When clients can book you.", icon: ClockIcon },
  {
    href: "/billing",
    title: "Plan and billing",
    description: "Pick your hosting plan, upgrade or downgrade, and manage billing.",
    icon: CreditCardIcon,
  },
  {
    href: "/settings/policies",
    title: "Policies and terms",
    description: "Your cancellation policy and terms and conditions.",
    icon: FileTextIcon,
  },
];

export default async function SettingsPage() {
  await requireBusiness();
  return (
    <>
      <PageHeader title="Settings" />
      <PageBody>
        <div className="grid gap-3 sm:grid-cols-2">
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-card transition-colors hover:border-black/10"
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{link.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                </div>
                <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </PageBody>
    </>
  );
}
