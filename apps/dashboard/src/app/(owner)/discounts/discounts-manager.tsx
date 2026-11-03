"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { currencySymbol } from "@glamsite/shared/format";
import type { DiscountCode, DiscountKind } from "@glamsite/shared/types";
import { EmptyState, Field, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { centsToInput } from "@/lib/order";
import { useAction } from "@/lib/use-action";
import { deleteDiscountCode, saveDiscountCode, setDiscountCodeActive, type DiscountCodeInput } from "./actions";

function toDraft(discount: DiscountCode | null): DiscountCodeInput {
  return {
    id: discount?.id,
    code: discount?.code ?? "",
    kind: discount?.kind ?? "percent",
    percentOff: discount?.percentOff ?? 10,
    amountOff: centsToInput(discount?.amountOffCents ?? null),
    isActive: discount?.isActive ?? true,
    maxRedemptions: discount?.maxRedemptions != null ? String(discount.maxRedemptions) : "",
    expiresAt: discount?.expiresAt ? discount.expiresAt.slice(0, 10) : "",
  };
}

function summarize(discount: DiscountCode, symbol: string): string {
  const value = discount.kind === "percent" ? `${discount.percentOff}% off` : `${symbol}${centsToInput(discount.amountOffCents) || "0"} off`;
  const used = discount.maxRedemptions != null ? `${discount.redemptionCount}/${discount.maxRedemptions} used` : `${discount.redemptionCount} used`;
  const expiry = discount.expiresAt ? `expires ${new Date(discount.expiresAt).toLocaleDateString()}` : null;
  return [value, used, expiry].filter(Boolean).join(" · ");
}

export function DiscountsManager({ currency, codes }: { currency: string; codes: DiscountCode[] }) {
  const { pending, run } = useAction();
  const [draft, setDraft] = useState<DiscountCodeInput | null>(null);
  const set = <K extends keyof DiscountCodeInput>(key: K, value: DiscountCodeInput[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  const symbol = currencySymbol(currency);

  return (
    <>
      <Panel
        title="Discount codes"
        description="A client enters one of these at checkout to pay less online. Doesn't apply to pay-at-the-salon bookings."
        actions={
          <Button onClick={() => setDraft(toDraft(null))}>
            <PlusIcon /> Add code
          </Button>
        }
      >
        {codes.length === 0 ? (
          <EmptyState title="No discount codes yet">Add one, then share it with clients to use when they book.</EmptyState>
        ) : (
          <ul className="divide-y divide-black/5 rounded-xl border border-black/5">
            {codes.map((discount) => (
              <li key={discount.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-medium">{discount.code}</p>
                  <p className="text-sm text-muted-foreground">{summarize(discount, symbol)}</p>
                </div>
                {!discount.isActive ? <Badge variant="outline">Off</Badge> : null}
                <Switch
                  checked={discount.isActive}
                  disabled={pending}
                  onCheckedChange={(checked) => run(() => setDiscountCodeActive(discount.id, checked))}
                  aria-label={discount.isActive ? `Turn off ${discount.code}` : `Turn on ${discount.code}`}
                />
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${discount.code}`}
                    onClick={() => setDraft(toDraft(discount))}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${discount.code}`}
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`Delete the code "${discount.code}"? Clients won't be able to use it again.`)) {
                        run(() => deleteDiscountCode(discount.id), "Discount code deleted");
                      }
                    }}
                  >
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
                run(() => saveDiscountCode(draft), draft.id ? "Discount code updated" : "Discount code added", () => setDraft(null));
              }}
            >
              <SheetHeader>
                <SheetTitle>{draft.id ? `Edit ${draft.code || "code"}` : "Add a discount code"}</SheetTitle>
                <SheetDescription>Clients type this in at checkout, exactly as written.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-5 px-4">
                <Field id="d-code" label="Code" description="Letters, numbers and hyphens only.">
                  <Input
                    id="d-code"
                    required
                    maxLength={40}
                    value={draft.code}
                    onChange={(event) => set("code", event.target.value.toUpperCase())}
                    className="font-mono uppercase"
                  />
                </Field>
                <Field label="Discount type">
                  <Select value={draft.kind} onValueChange={(value) => set("kind", value as DiscountKind)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage off</SelectItem>
                      <SelectItem value="fixed">Fixed amount off</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                {draft.kind === "percent" ? (
                  <Field id="d-percent" label="Percent off">
                    <Input
                      id="d-percent"
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={draft.percentOff}
                      onChange={(event) => set("percentOff", Number(event.target.value))}
                    />
                  </Field>
                ) : (
                  <Field id="d-amount" label={`Amount off (${symbol})`}>
                    <Input
                      id="d-amount"
                      inputMode="decimal"
                      required
                      value={draft.amountOff}
                      onChange={(event) => set("amountOff", event.target.value)}
                    />
                  </Field>
                )}
                <Field id="d-max" label="Redemption limit" description="Leave blank for unlimited uses.">
                  <Input
                    id="d-max"
                    type="number"
                    min={1}
                    value={draft.maxRedemptions}
                    onChange={(event) => set("maxRedemptions", event.target.value)}
                  />
                </Field>
                <Field id="d-expires" label="Expires" description="Leave blank for no expiry.">
                  <Input
                    id="d-expires"
                    type="date"
                    value={draft.expiresAt}
                    onChange={(event) => set("expiresAt", event.target.value)}
                  />
                </Field>
                <label className="flex items-center justify-between gap-4 text-sm">
                  Active
                  <Switch checked={draft.isActive} onCheckedChange={(checked) => set("isActive", checked)} />
                </label>
              </div>
              <SheetFooter>
                <Button type="submit" size="lg" loading={pending}>{pending ? "Saving…" : "Save"}</Button>
              </SheetFooter>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
