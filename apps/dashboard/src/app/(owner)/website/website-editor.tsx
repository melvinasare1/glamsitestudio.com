"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import {
  SITE_SECTIONS,
  isSectionEnabled,
  type SectionKey,
  type SectionValues,
  type SiteContent,
} from "@glamsite/shared/site-content";
import { TEMPLATES, getTemplate, templateShowsSection } from "@glamsite/shared/templates";
import type { Business } from "@glamsite/shared/types";
import { ListInput, ScalarInput } from "@/components/editor/field-input";
import { Field, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { saveSection, saveTemplate } from "./actions";

/**
 * The website editor. Everything here comes from SITE_SECTIONS, so it works
 * for every template: switching template changes which sections are shown on
 * the site, never what the owner has entered.
 */
export function WebsiteEditor({ business, demoBaseUrl }: { business: Business; demoBaseUrl: string }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(business.templateId);
  const [draft, setDraft] = useState<SiteContent>(business.content);
  const [dirty, setDirty] = useState<Set<SectionKey>>(new Set());
  const [active, setActive] = useState<SectionKey>("hero");
  const [saving, startSaving] = useTransition();
  const [switching, startSwitching] = useTransition();

  const section = SITE_SECTIONS.find((item) => item.key === active) ?? SITE_SECTIONS[0];
  const values: SectionValues = draft[active] ?? {};
  const template = getTemplate(templateId);

  function setValue(key: string, value: SectionValues[string]) {
    setDraft((prev) => ({ ...prev, [active]: { ...(prev[active] ?? {}), [key]: value } }));
    setDirty((prev) => new Set(prev).add(active));
  }

  function onSave() {
    startSaving(async () => {
      const result = await saveSection(active, draft[active] ?? {});
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDirty((prev) => {
        const next = new Set(prev);
        next.delete(active);
        return next;
      });
      toast.success(`${section.label} saved`);
      router.refresh();
    });
  }

  function onTemplateChange(next: string) {
    const previous = templateId;
    setTemplateId(next);
    startSwitching(async () => {
      const result = await saveTemplate(next);
      if (!result.ok) {
        setTemplateId(previous);
        toast.error(result.error);
        return;
      }
      toast.success(`Switched to the ${getTemplate(next).name} template. Your content is unchanged.`);
      router.refresh();
    });
  }

  function sectionStatus(key: SectionKey): { label: string; muted: boolean } | null {
    if (!templateShowsSection(templateId, key)) return { label: `Not in ${template.name}`, muted: true };
    if (!isSectionEnabled(draft, key)) return { label: "Hidden", muted: true };
    return null;
  }

  return (
    <div className="grid gap-6">
      <Panel
        title="Template"
        description="Your design. Switch any time: your text, photos, services and team stay as they are."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Select value={templateId} onValueChange={onTemplateChange} disabled={switching}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{template.tagline}</p>
          <Button asChild variant="link" className="px-0">
            <a href={`${demoBaseUrl}/demo/${template.id}`} target="_blank" rel="noopener noreferrer">
              Preview with demo content
            </a>
          </Button>
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
        <nav aria-label="Sections" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {SITE_SECTIONS.map((item) => {
            const status = sectionStatus(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActive(item.key)}
                aria-current={active === item.key ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                  active === item.key ? "bg-white font-medium shadow-card" : "text-muted-foreground hover:bg-white/60",
                  status?.muted && active !== item.key && "opacity-60"
                )}
              >
                <span className="truncate">{item.label}</span>
                <span className="flex items-center gap-1">
                  {status ? <EyeOffIcon className="size-3.5" aria-label={status.label} /> : null}
                  {dirty.has(item.key) ? <span className="size-2 rounded-full bg-signal" aria-label="Unsaved changes" /> : null}
                </span>
              </button>
            );
          })}
        </nav>

        <Panel
          title={section.label}
          description={section.description}
          actions={
            sectionStatus(active) ? (
              <Badge variant="outline">{sectionStatus(active)?.label}</Badge>
            ) : null
          }
        >
          {!templateShowsSection(templateId, active) ? (
            <p className="mb-5 rounded-lg bg-mist px-4 py-3 text-sm text-muted-foreground">
              The {template.name} template doesn&apos;t show this section. You can still fill it in; it appears if you
              switch to a template that uses it.
            </p>
          ) : null}

          <div className="grid gap-5">
            {section.fields.map((field) => {
              const id = `${section.key}-${field.key}`;
              if (field.type === "list") {
                return (
                  <Field key={field.key} label={field.label} description={field.description}>
                    <ListInput
                      field={field}
                      value={values[field.key]}
                      onChange={(items) => setValue(field.key, items)}
                      businessId={business.id}
                      idPrefix={id}
                    />
                  </Field>
                );
              }
              return (
                <Field key={field.key} id={id} label={field.label} description={field.description}>
                  <ScalarInput
                    id={id}
                    field={field}
                    value={values[field.key]}
                    onChange={(next) => setValue(field.key, next)}
                    businessId={business.id}
                  />
                </Field>
              );
            })}
          </div>

          {section.managedBy ? (
            <Link
              href={section.managedBy.href}
              className="mt-6 flex items-center justify-between rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand"
            >
              {section.managedBy.label}
              <ArrowRightIcon className="size-4" />
            </Link>
          ) : null}

          <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-5">
            <Button type="button" size="lg" onClick={onSave} disabled={saving || !dirty.has(active)}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {dirty.size > 1 || (dirty.size === 1 && !dirty.has(active)) ? (
              <p className="text-xs text-muted-foreground">Other sections have unsaved changes too.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
