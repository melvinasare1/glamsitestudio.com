"use client";

/* eslint-disable @next/next/no-img-element -- public storage URLs */
import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { Service, StaffMember } from "@glamsite/shared/types";
import { ImageInput } from "@/components/editor/image-input";
import { EmptyState, Field, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/lib/use-action";
import { deleteStaff, moveStaff, saveStaff, type StaffInput } from "./actions";

function toDraft(person: StaffMember | null): StaffInput {
  return {
    id: person?.id,
    name: person?.name ?? "",
    role: person?.role ?? "",
    bio: person?.bio ?? "",
    photoUrl: person?.photoUrl ?? "",
    isVisible: person?.isVisible ?? true,
    isBookable: person?.isBookable ?? true,
    serviceIds: person?.serviceIds ?? [],
  };
}

export function TeamManager({
  businessId,
  staff,
  services,
}: {
  businessId: string;
  staff: StaffMember[];
  services: Service[];
}) {
  const { pending, run } = useAction();
  const [draft, setDraft] = useState<StaffInput | null>(null);
  const set = <K extends keyof StaffInput>(key: K, value: StaffInput[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  function toggleService(id: string, on: boolean) {
    setDraft((prev) => {
      if (!prev) return prev;
      const ids = new Set(prev.serviceIds);
      if (on) ids.add(id);
      else ids.delete(id);
      return { ...prev, serviceIds: [...ids] };
    });
  }

  return (
    <>
      <Panel
        title="Team members"
        description="Shown on your site in this order. Solo? Add yourself so clients know who they're booking."
        actions={
          <Button onClick={() => setDraft(toDraft(null))}>
            <PlusIcon /> Add person
          </Button>
        }
      >
        {staff.length === 0 ? (
          <EmptyState title="No team members yet" />
        ) : (
          <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
            {staff.map((person, index) => (
              <li key={person.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                {person.photoUrl ? (
                  <img src={person.photoUrl} alt="" className="size-11 rounded-full object-cover" />
                ) : (
                  <span className="flex size-11 items-center justify-center rounded-full bg-mist font-semibold">
                    {person.name.charAt(0)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{person.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[person.role, `${person.serviceIds.length} service${person.serviceIds.length === 1 ? "" : "s"}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {!person.isVisible ? <Badge variant="outline">Hidden</Badge> : null}
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={pending || index === 0}
                    onClick={() => run(() => moveStaff(person.id, -1))}>
                    <ArrowUpIcon />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={pending || index === staff.length - 1}
                    onClick={() => run(() => moveStaff(person.id, 1))}>
                    <ArrowDownIcon />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${person.name}`} onClick={() => setDraft(toDraft(person))}>
                    <PencilIcon />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Remove ${person.name}`} disabled={pending}
                    onClick={() => {
                      if (window.confirm(`Remove ${person.name} from your team?`)) {
                        run(() => deleteStaff(person.id), "Team member removed");
                      }
                    }}>
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Sheet open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {draft ? (
            <form
              className="flex h-full flex-col"
              onSubmit={(event) => {
                event.preventDefault();
                run(() => saveStaff(draft), draft.id ? "Team member updated" : "Team member added", () => setDraft(null));
              }}
            >
              <SheetHeader>
                <SheetTitle>{draft.id ? `Edit ${draft.name || "team member"}` : "Add a team member"}</SheetTitle>
                <SheetDescription>Shown in the Team section of your site.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-5 px-4">
                <Field label="Photo">
                  <ImageInput businessId={businessId} value={draft.photoUrl} aspect="square"
                    onChange={(url) => set("photoUrl", url)} />
                </Field>
                <Field id="staff-name" label="Name">
                  <Input id="staff-name" required maxLength={80} value={draft.name}
                    onChange={(event) => set("name", event.target.value)} />
                </Field>
                <Field id="staff-role" label="Role" description="e.g. Senior stylist, Nail technician">
                  <Input id="staff-role" maxLength={80} value={draft.role}
                    onChange={(event) => set("role", event.target.value)} />
                </Field>
                <Field id="staff-bio" label="Short bio">
                  <Textarea id="staff-bio" maxLength={600} value={draft.bio}
                    onChange={(event) => set("bio", event.target.value)} />
                </Field>
                <Field label="Services they do" description="Used when clients book online.">
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Add services first, then come back.</p>
                  ) : (
                    <div className="grid gap-2 rounded-lg border border-black/8 p-3">
                      {services.map((service) => (
                        <label key={service.id} className="flex items-center gap-2 text-sm">
                          <Checkbox checked={draft.serviceIds.includes(service.id)}
                            onCheckedChange={(checked) => toggleService(service.id, checked === true)} />
                          {service.name}
                        </label>
                      ))}
                    </div>
                  )}
                </Field>
                <label className="flex items-center justify-between gap-4 text-sm">
                  Show on my site
                  <Switch checked={draft.isVisible} onCheckedChange={(checked) => set("isVisible", checked)} />
                </label>
                <label className="flex items-center justify-between gap-4 text-sm">
                  Clients can book with them online
                  <Switch checked={draft.isBookable} onCheckedChange={(checked) => set("isBookable", checked)} />
                </label>
              </div>
              <SheetFooter>
                <Button type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
              </SheetFooter>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
