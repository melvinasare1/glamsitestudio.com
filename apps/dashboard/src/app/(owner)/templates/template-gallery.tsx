"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TEMPLATES, TEMPLATE_TIER_LABEL, type TemplateBusinessType, type TemplateTier } from "@glamsite/shared/templates";
import { TemplatePreviewFrame } from "@/components/template-preview-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveTemplate } from "../website/actions";

const BUSINESS_TYPE_LABEL: Record<TemplateBusinessType, string> = {
  all: "All business types",
  salon: "Hair salon",
  barber: "Barbershop",
  nails: "Nails",
  "lash-brow": "Lash & brow",
  makeup: "Makeup",
};

const BUSINESS_TYPE_FILTERS: TemplateBusinessType[] = ["all", "salon", "barber", "nails", "lash-brow", "makeup"];

type PriceFilter = "all" | "free" | "paid";
type TierFilter = "all" | TemplateTier;

const TIER_FILTERS: TemplateTier[] = ["single-page", "multipage", "premium"];

/** Filterable gallery of every template, with switching built in. */
export function TemplateGallery({ templateId, demoBaseUrl }: { templateId: string; demoBaseUrl: string }) {
  const router = useRouter();
  const [businessType, setBusinessType] = useState<TemplateBusinessType>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [switching, startSwitching] = useTransition();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const templates = useMemo(() => {
    return TEMPLATES.filter((item) => {
      if (businessType !== "all" && !item.businessTypes.includes(businessType) && !item.businessTypes.includes("all"))
        return false;
      if (tier !== "all" && item.tier !== tier) return false;
      if (price === "free" && item.priceCents > 0) return false;
      if (price === "paid" && item.priceCents === 0) return false;
      return true;
    });
  }, [businessType, tier, price]);

  function onSelect(id: string) {
    setSwitchingId(id);
    startSwitching(async () => {
      const result = await saveTemplate(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const next = TEMPLATES.find((item) => item.id === id);
      toast.success(
        result.seeded
          ? `Switched to the ${next?.name ?? id} template, filled in with example content to edit.`
          : `Switched to the ${next?.name ?? id} template. Your content is unchanged.`
      );
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={businessType} onValueChange={(value) => setBusinessType(value as TemplateBusinessType)}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPE_FILTERS.map((item) => (
              <SelectItem key={item} value={item}>
                {BUSINESS_TYPE_LABEL[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tier} onValueChange={(value) => setTier(value as TierFilter)}>
          <SelectTrigger className="w-40 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            {TIER_FILTERS.map((item) => (
              <SelectItem key={item} value={item}>
                {TEMPLATE_TIER_LABEL[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={price} onValueChange={(value) => setPrice(value as PriceFilter)}>
          <SelectTrigger className="w-32 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Free & paid</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        {businessType !== "all" || tier !== "all" || price !== "all" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setBusinessType("all");
              setTier("all");
              setPrice("all");
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {templates.length === 0 ? (
        <p className="rounded-lg bg-mist px-4 py-3 text-sm text-muted-foreground">
          No templates match those filters.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((item) => {
            const selected = item.id === templateId;
            const demoHref = `${demoBaseUrl}/demo/${item.id}`;
            return (
              <Card key={item.id} className={selected ? "gap-0 ring-2 ring-brand" : "gap-0"}>
                <Link href={`/templates/${item.id}`} className="block">
                  <TemplatePreviewFrame src={demoHref} />
                </Link>
                <CardContent className="grid gap-1 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/templates/${item.id}`} className="hover:underline">
                      <CardTitle>{item.name}</CardTitle>
                    </Link>
                    <div className="flex items-center gap-1">
                      {selected ? <Badge>Selected</Badge> : null}
                      <Badge variant="outline">{TEMPLATE_TIER_LABEL[item.tier]}</Badge>
                      <Badge variant="outline">{item.priceCents === 0 ? "Free" : `$${item.priceCents / 100}`}</Badge>
                    </div>
                  </div>
                  <CardDescription>{item.tagline}</CardDescription>
                  <div className="mt-3 flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/templates/${item.id}`}>Details</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onSelect(item.id)}
                      disabled={switching || selected}
                    >
                      {selected ? "Selected" : switching && switchingId === item.id ? "Switching…" : "Select"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
