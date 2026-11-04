"use client";

import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";
import type { Client } from "@glamsite/shared/types";
import { formatMoney } from "@glamsite/shared/format";
import { EmptyState, Field, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/lib/use-action";
import { setAppointmentStatus } from "../appointments/actions";
import { saveClient, type ClientInput } from "./actions";

export type ClientVisit = {
  id: string;
  serviceName: string;
  startsAt: string;
  status: string;
  priceCents: number | null;
  currency: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
  late: "Late",
};

/** Statuses a client might ask the owner to cancel on their behalf. */
const CANCELLABLE_STATUSES = new Set(["pending", "confirmed", "late"]);

function toDraft(client: Client | null): ClientInput {
  return {
    id: client?.id,
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    notes: client?.notes ?? "",
  };
}

export function CustomersManager({
  clients,
  visitsByClient,
}: {
  clients: Client[];
  visitsByClient: Record<string, ClientVisit[]>;
}) {
  const { pending, run } = useAction();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<ClientInput | null>(null);
  const set = <K extends keyof ClientInput>(key: K, value: ClientInput[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q)
    );
  }, [clients, query]);

  const selectedVisits = draft?.id ? visitsByClient[draft.id] ?? [] : [];

  return (
    <>
      <Panel
        title="Clients"
        description="Added automatically the first time someone books with you. You can also add one by hand."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-56 pl-8"
              />
            </div>
            <Button onClick={() => setDraft(toDraft(null))}>
              <PlusIcon /> Add client
            </Button>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState title={clients.length === 0 ? "No clients yet" : "No matches"}>
            {clients.length === 0 ? "They'll show up here the first time someone books, or add one yourself." : "Try a different search."}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
            {filtered.map((client) => {
              const visits = visitsByClient[client.id] ?? [];
              const lastVisit = visits[0];
              return (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => setDraft(toDraft(client))}
                    className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-mist/60"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist font-semibold">
                      {client.name.charAt(0).toUpperCase() || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{client.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {[client.email, client.phone].filter(Boolean).join(" · ") || "No contact details"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-sm text-muted-foreground">
                      <p>
                        {visits.length} visit{visits.length === 1 ? "" : "s"}
                      </p>
                      {lastVisit ? <p>Last {new Date(lastVisit.startsAt).toLocaleDateString()}</p> : null}
                    </div>
                  </button>
                </li>
              );
            })}
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
                run(() => saveClient(draft), draft.id ? "Client updated" : "Client added", () => setDraft(null));
              }}
            >
              <SheetHeader>
                <SheetTitle>{draft.id ? "Edit client" : "Add a client"}</SheetTitle>
                <SheetDescription>
                  {draft.id ? "Contact details and notes are only visible to you and your team." : "Add someone who booked offline, or who you want on file before their first visit."}
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-5 px-4">
                <Field id="c-name" label="Name">
                  <Input
                    id="c-name"
                    required
                    maxLength={120}
                    value={draft.name}
                    onChange={(event) => set("name", event.target.value)}
                  />
                </Field>
                <Field id="c-email" label="Email" description="Optional.">
                  <Input
                    id="c-email"
                    type="email"
                    value={draft.email}
                    onChange={(event) => set("email", event.target.value)}
                  />
                </Field>
                <Field id="c-phone" label="Phone" description="Optional.">
                  <Input
                    id="c-phone"
                    type="tel"
                    value={draft.phone}
                    onChange={(event) => set("phone", event.target.value)}
                  />
                </Field>
                <Field id="c-notes" label="Notes" description="Only visible to you and your team, never to the client.">
                  <Textarea
                    id="c-notes"
                    maxLength={2000}
                    rows={4}
                    value={draft.notes}
                    onChange={(event) => set("notes", event.target.value)}
                  />
                </Field>
                {draft.id ? (
                  <div>
                    <p className="mb-2 text-sm font-medium">Appointment history</p>
                    {selectedVisits.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No appointments yet.</p>
                    ) : (
                      <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
                        {selectedVisits.map((visit) => {
                          const upcoming = new Date(visit.startsAt).getTime() > Date.now();
                          const cancellable = upcoming && CANCELLABLE_STATUSES.has(visit.status);
                          return (
                            <li key={visit.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                              <div className="min-w-0">
                                <p className="truncate font-medium">{visit.serviceName}</p>
                                <p className="text-muted-foreground">
                                  {new Date(visit.startsAt).toLocaleDateString()} ·{" "}
                                  {STATUS_LABEL[visit.status] ?? visit.status}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-3">
                                <p className="font-medium">
                                  {visit.priceCents == null ? "—" : formatMoney(visit.priceCents, visit.currency)}
                                </p>
                                {cancellable ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    disabled={pending}
                                    onClick={() => {
                                      if (!window.confirm(`Cancel this ${visit.serviceName} appointment on their behalf?`)) return;
                                      run(() => setAppointmentStatus(visit.id, "cancelled"), "Appointment cancelled");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
              <SheetFooter>
                <Button type="submit" size="lg" loading={pending}>
                  {pending ? "Saving…" : draft.id ? "Save" : "Add client"}
                </Button>
              </SheetFooter>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
