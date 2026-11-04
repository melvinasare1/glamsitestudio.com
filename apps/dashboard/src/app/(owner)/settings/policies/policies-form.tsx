"use client";

import { useState } from "react";
import type { Business } from "@glamsite/shared/types";
import { Field, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/lib/use-action";
import { savePolicies, type PoliciesInput } from "./actions";

export function PoliciesForm({ business }: { business: Business }) {
  const { pending, run } = useAction();
  const [form, setForm] = useState<PoliciesInput>({
    policiesText: business.policiesText ?? "",
    termsText: business.termsText ?? "",
  });

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => savePolicies(form), "Saved");
      }}
    >
      <Panel
        title="Business policies"
        description="Cancellation, lateness, rescheduling — whatever clients should know before they book. Plain text for now."
      >
        <Field id="s-policies" label="Policies">
          <Textarea
            id="s-policies"
            rows={8}
            maxLength={20000}
            value={form.policiesText}
            onChange={(event) => setForm((prev) => ({ ...prev, policiesText: event.target.value }))}
            placeholder="e.g. Please give at least 24 hours' notice to cancel or reschedule..."
          />
        </Field>
      </Panel>

      <Panel title="Terms and conditions" description="Your own terms, in your own words.">
        <Field id="s-terms" label="Terms and conditions">
          <Textarea
            id="s-terms"
            rows={8}
            maxLength={20000}
            value={form.termsText}
            onChange={(event) => setForm((prev) => ({ ...prev, termsText: event.target.value }))}
            placeholder="e.g. By booking an appointment you agree to..."
          />
        </Field>
      </Panel>

      <div>
        <Button type="submit" size="lg" loading={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
