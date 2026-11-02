"use client";

import { useState } from "react";
import { CURRENCIES } from "@glamsite/shared/format";
import type { Business } from "@glamsite/shared/types";
import { Field, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAction } from "@/lib/use-action";
import { saveDetails, type DetailsInput } from "./actions";
import { COUNTRIES, TIMEZONES } from "./options";

export function DetailsForm({ business }: { business: Business }) {
  const { pending, run } = useAction();
  const [form, setForm] = useState<DetailsInput>({
    name: business.name,
    email: business.email,
    phone: business.phone,
    line1: business.address.line1,
    line2: business.address.line2,
    city: business.address.city,
    postcode: business.address.postcode,
    country: business.address.country,
    timezone: business.timezone,
    currency: business.currency,
  });
  const set = (key: keyof DetailsInput) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const text = (key: keyof DetailsInput, label: string, extra: React.ComponentProps<typeof Input> = {}) => (
    <Field id={`d-${key}`} label={label}>
      <Input id={`d-${key}`} value={form[key]} onChange={(event) => set(key)(event.target.value)} {...extra} />
    </Field>
  );

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => saveDetails(form), "Details saved");
      }}
    >
      <Panel title="Business" description="Your name and contact details appear on your site.">
        <div className="grid gap-5 md:grid-cols-2">
          {text("name", "Business name", { required: true, maxLength: 120, className: "md:col-span-2" })}
          {text("email", "Email", { type: "email", maxLength: 254 })}
          {text("phone", "Phone", { type: "tel", maxLength: 40 })}
        </div>
      </Panel>

      <Panel title="Address" description="Shown in the Visit us section, with a map.">
        <div className="grid gap-5 md:grid-cols-2">
          {text("line1", "Address line 1", { maxLength: 120 })}
          {text("line2", "Address line 2", { maxLength: 120 })}
          {text("city", "Town or city", { maxLength: 80 })}
          {text("postcode", "Postcode", { maxLength: 20 })}
          <Field id="d-country" label="Country">
            <Select value={form.country} onValueChange={set("country")}>
              <SelectTrigger id="d-country" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Panel>

      <Panel title="Region" description="Used for prices and booking times.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="d-timezone" label="Time zone">
            <Select value={form.timezone} onValueChange={set("timezone")}>
              <SelectTrigger id="d-timezone" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field id="d-currency" label="Currency">
            <Select value={form.currency} onValueChange={set("currency")}>
              <SelectTrigger id="d-currency" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Panel>

      <div>
        <Button type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : "Save details"}</Button>
      </div>
    </form>
  );
}
