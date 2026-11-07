"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, CheckIcon, MonitorIcon, SmartphoneIcon } from "lucide-react";
import { toast } from "sonner";
import { TEMPLATE_TIER_LABEL, getTemplate } from "@glamsite/shared/templates";
import { TemplatePreviewFrame } from "@/components/template-preview-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveTemplate } from "../../website/actions";

const DEVICES = {
  desktop: { label: "Desktop", icon: MonitorIcon, width: 1280, height: 900 },
  mobile: { label: "Mobile", icon: SmartphoneIcon, width: 390, height: 844 },
} as const;

/**
 * Full-detail view of one template: a bigger live preview with a
 * desktop/mobile toggle, description, feature list, and the actions to open
 * the live demo or switch this business to it. Modeled on a theme-store
 * product page (e.g. Shopify's), but kept inside the dashboard since this is
 * an authenticated, per-owner screen, not public marketing content.
 */
export function TemplatePreviewDetailsScreen({
  templateId,
  currentTemplateId,
  demoBaseUrl,
}: {
  templateId: string;
  currentTemplateId: string;
  demoBaseUrl: string;
}) {
  const router = useRouter();
  const template = getTemplate(templateId);
  const selected = templateId === currentTemplateId;
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [switching, startSwitching] = useTransition();
  const demoHref = `${demoBaseUrl}/demo/${templateId}`;

  function onSelect() {
    startSwitching(async () => {
      const result = await saveTemplate(templateId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.seeded
          ? `Switched to the ${template.name} template, filled in with example content to edit.`
          : `Switched to the ${template.name} template. Your content is unchanged.`
      );
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      <Link href="/templates" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        All templates
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-3">
          <div className="flex items-center justify-center gap-1 self-start rounded-xl bg-mist p-1">
            {Object.entries(DEVICES).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key as keyof typeof DEVICES)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  device === key ? "bg-white shadow-card" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div
            className={cn(
              "overflow-hidden rounded-2xl border border-black/5 bg-mist shadow-card transition-all",
              device === "mobile" ? "mx-auto w-full max-w-sm" : "w-full"
            )}
          >
            <TemplatePreviewFrame
              src={demoHref}
              viewportWidth={DEVICES[device].width}
              viewportHeight={DEVICES[device].height}
            />
          </div>
        </div>

        <div className="grid gap-5 self-start content-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{template.name}</h2>
              {selected ? <Badge>Selected</Badge> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline">{TEMPLATE_TIER_LABEL[template.tier]}</Badge>
              <Badge variant="outline">{template.priceCents === 0 ? "Free" : `$${template.priceCents / 100}`}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{template.description ?? template.tagline}</p>
          </div>

          {template.features.length > 0 ? (
            <ul className="grid gap-2 content-start text-sm">
              {template.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-col gap-2 border-t border-black/5 pt-5">
            <Button type="button" size="lg" onClick={onSelect} disabled={selected || switching}>
              {selected ? "Currently selected" : switching ? "Switching…" : "Use this template"}
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={demoHref} target="_blank" rel="noopener noreferrer">
                Open live demo
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
