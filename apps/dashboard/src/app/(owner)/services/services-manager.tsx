"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { formatDuration, formatServicePrice, groupServices } from "@glamsite/shared/format";
import type { Service, ServiceCategory } from "@glamsite/shared/types";
import { EmptyState, Field, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { centsToInput } from "@/lib/order";
import { useAction } from "@/lib/use-action";
import {
  deleteCategory,
  deleteService,
  moveCategory,
  moveService,
  saveCategory,
  saveService,
  type ServiceInput,
} from "./actions";

const DURATIONS = [10, 15, 20, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300, 360, 420, 480];
const NO_CATEGORY = "none";

type Draft = Omit<ServiceInput, "durationMinutes" | "bufferMinutes"> & { durationMinutes: string; bufferMinutes: string };

function toDraft(service: Service | null, categoryId: string | null): Draft {
  return {
    id: service?.id,
    categoryId: service ? service.categoryId : categoryId,
    name: service?.name ?? "",
    description: service?.description ?? "",
    durationMinutes: String(service?.durationMinutes ?? 60),
    price: centsToInput(service?.priceCents ?? null),
    priceIsFrom: service?.priceIsFrom ?? false,
    bufferMinutes: String(service?.bufferMinutes ?? 0),
    isVisible: service?.isVisible ?? true,
    isBookable: service?.isBookable ?? true,
  };
}

export function ServicesManager({
  categories,
  services,
  currency,
}: {
  categories: ServiceCategory[];
  services: Service[];
  currency: string;
}) {
  const { pending, run } = useAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const groups = groupServices(categories, services);
  const sortedCategories = [...categories].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "£";

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    run(
      () =>
        saveService({
          ...draft,
          durationMinutes: Number(draft.durationMinutes),
          bufferMinutes: Number(draft.bufferMinutes),
        }),
      draft.id ? "Service updated" : "Service added",
      () => setDraft(null)
    );
  }

  return (
    <div className="grid gap-6">
      <Panel
        title="Price list"
        description="Shown on your site in this order. Hidden services stay here but don't appear on your site."
        actions={
          <Button onClick={() => setDraft(toDraft(null, null))}>
            <PlusIcon /> Add service
          </Button>
        }
      >
        {groups.length === 0 ? (
          <EmptyState title="No services yet">Add your first service, like &ldquo;Cut &amp; blow dry, 60 min, £55&rdquo;.</EmptyState>
        ) : (
          <div className="grid gap-8">
            {groups.map((group) => (
              <div key={group.category?.id ?? "none"}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.category?.name ?? "No category"}
                </h3>
                <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
                  {group.services.map((service, index) => (
                    <li key={service.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDuration(service.durationMinutes)} · {formatServicePrice(service, currency)}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {!service.isVisible ? <Badge variant="outline">Hidden</Badge> : null}
                        {!service.isBookable ? <Badge variant="outline">Not bookable</Badge> : null}
                      </div>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={pending || index === 0}
                          onClick={() => run(() => moveService(service.id, -1))}>
                          <ArrowUpIcon />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Move down"
                          disabled={pending || index === group.services.length - 1}
                          onClick={() => run(() => moveService(service.id, 1))}>
                          <ArrowDownIcon />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${service.name}`}
                          onClick={() => setDraft(toDraft(service, null))}>
                          <PencilIcon />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${service.name}`} disabled={pending}
                          onClick={() => {
                            if (window.confirm(`Delete “${service.name}”? Past bookings keep their details.`)) {
                              run(() => deleteService(service.id), "Service deleted");
                            }
                          }}>
                          <Trash2Icon />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Categories" description="Group your price list, e.g. Cuts, Colour, Treatments.">
        <ul className="grid gap-2">
          {sortedCategories.map((category, index) => (
            <li key={category.id} className="flex items-center gap-2">
              {renaming?.id === category.id ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    run(() => saveCategory(renaming), "Category renamed", () => setRenaming(null));
                  }}
                >
                  <Input autoFocus value={renaming.name} maxLength={80}
                    onChange={(event) => setRenaming({ ...renaming, name: event.target.value })} />
                  <Button type="submit" disabled={pending}>Save</Button>
                  <Button type="button" variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-sm">{category.name}</span>
                  <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={pending || index === 0}
                    onClick={() => run(() => moveCategory(category.id, -1))}>
                    <ArrowUpIcon />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Move down"
                    disabled={pending || index === sortedCategories.length - 1}
                    onClick={() => run(() => moveCategory(category.id, 1))}>
                    <ArrowDownIcon />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Rename ${category.name}`}
                    onClick={() => setRenaming({ id: category.id, name: category.name })}>
                    <PencilIcon />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Delete ${category.name}`} disabled={pending}
                    onClick={() => {
                      if (window.confirm(`Delete the “${category.name}” category? Its services are kept.`)) {
                        run(() => deleteCategory(category.id), "Category deleted");
                      }
                    }}>
                    <Trash2Icon />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
        <form
          className="mt-4 flex max-w-md gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => saveCategory({ name: newCategory }), "Category added", () => setNewCategory(""));
          }}
        >
          <Input value={newCategory} maxLength={80} placeholder="New category name"
            onChange={(event) => setNewCategory(event.target.value)} />
          <Button type="submit" variant="outline" disabled={pending || !newCategory.trim()}>
            <PlusIcon /> Add
          </Button>
        </form>
      </Panel>

      <Sheet open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {draft ? (
            <form onSubmit={submit} className="flex h-full flex-col">
              <SheetHeader>
                <SheetTitle>{draft.id ? "Edit service" : "Add a service"}</SheetTitle>
                <SheetDescription>What clients see on your price list.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-5 px-4">
                <Field id="svc-name" label="Name">
                  <Input id="svc-name" required maxLength={120} value={draft.name} placeholder="e.g. Cut & blow dry"
                    onChange={(event) => set("name", event.target.value)} />
                </Field>
                <Field id="svc-category" label="Category">
                  <Select value={draft.categoryId ?? NO_CATEGORY}
                    onValueChange={(value) => set("categoryId", value === NO_CATEGORY ? null : value)}>
                    <SelectTrigger id="svc-category" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                      {sortedCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field id="svc-duration" label="Duration">
                    <Select value={draft.durationMinutes} onValueChange={(value) => set("durationMinutes", value)}>
                      <SelectTrigger id="svc-duration" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set([...DURATIONS, Number(draft.durationMinutes)]))
                          .sort((a, b) => a - b)
                          .map((minutes) => (
                            <SelectItem key={minutes} value={String(minutes)}>{formatDuration(minutes)}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field id="svc-price" label={`Price (${symbol})`} description="Leave empty for “price on consultation”.">
                    <Input id="svc-price" inputMode="decimal" value={draft.price} placeholder="45"
                      onChange={(event) => set("price", event.target.value)} />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={draft.priceIsFrom} disabled={!draft.price.trim()}
                    onCheckedChange={(checked) => set("priceIsFrom", checked === true)} />
                  Show as a starting price (&ldquo;From {symbol}{draft.price || "45"}&rdquo;)
                </label>
                <Field id="svc-description" label="Description" description="Optional. A line about what's included.">
                  <Textarea id="svc-description" maxLength={600} value={draft.description}
                    onChange={(event) => set("description", event.target.value)} />
                </Field>
                <Field id="svc-buffer" label="Clean-up time after (minutes)" description="Used for online booking, so the next client isn't booked straight away.">
                  <Input id="svc-buffer" type="number" min={0} max={240} step={5} value={draft.bufferMinutes}
                    onChange={(event) => set("bufferMinutes", event.target.value)} className="w-28" />
                </Field>
                <label className="flex items-center justify-between gap-4 text-sm">
                  Show on my site
                  <Switch checked={draft.isVisible} onCheckedChange={(checked) => set("isVisible", checked)} />
                </label>
                <label className="flex items-center justify-between gap-4 text-sm">
                  Clients can book this online
                  <Switch checked={draft.isBookable} onCheckedChange={(checked) => set("isBookable", checked)} />
                </label>
              </div>
              <SheetFooter>
                <Button type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : "Save service"}</Button>
              </SheetFooter>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
