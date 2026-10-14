"use client";

import { useState } from "react";
import type { Business } from "@glamsite/shared/types";
import { Field, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";
import { saveBooking } from "./actions";

type Mode = "none" | "link" | "glamsite";

const OPTIONS: { value: Mode; title: string; body: string; soon?: boolean }[] = [
  { value: "link", title: "My booking page", body: "Book buttons open the booking tool you already use: Fresha, Booksy, Calendly, Square and so on." },
  { value: "none", title: "No online booking", body: "Book buttons take clients to your contact details and message form." },
  { value: "glamsite", title: "Glam Site booking", body: "Bookings, deposits and reminders built into your site and this dashboard.", soon: true },
];

export function BookingForm({ business }: { business: Business }) {
  const { pending, run } = useAction();
  const [mode, setMode] = useState<Mode>(business.bookingMode === "glamsite" ? "none" : business.bookingMode);
  const [url, setUrl] = useState(business.bookingUrl);

  return (
    <Panel title="Where do clients book?" description="This decides where every Book button on your site goes.">
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (mode === "glamsite") return;
          run(() => saveBooking({ mode, url }), "Booking settings saved");
        }}
      >
        <div role="radiogroup" className="grid gap-3">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={mode === option.value}
              disabled={option.soon}
              onClick={() => setMode(option.value)}
              className={cn(
                "rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                mode === option.value ? "border-brand bg-brand-soft/50 ring-1 ring-brand" : "border-black/8 hover:border-black/20"
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                {option.title}
                {option.soon ? <Badge variant="outline">Coming soon</Badge> : null}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{option.body}</span>
            </button>
          ))}
        </div>
        {mode === "link" ? (
          <Field id="booking-url" label="Booking page link" description="Copy the link clients use to book with you.">
            <Input id="booking-url" type="url" value={url} placeholder="https://www.fresha.com/book-now/…"
              onChange={(event) => setUrl(event.target.value)} />
          </Field>
        ) : null}
        <div>
          <Button type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Panel>
  );
}
