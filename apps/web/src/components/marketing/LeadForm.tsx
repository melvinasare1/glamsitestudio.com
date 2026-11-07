"use client";

import { useMemo, useState } from "react";
import { callSlotOptions } from "@glamsite/shared/call-slots";

const input =
  "w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-plum outline-none placeholder:text-mauve/60 focus:border-berry focus:ring-1 focus:ring-berry";

/**
 * Done-for-you enquiries → /api/leads. No intake form: just enough to know
 * who to call, plus a time that suits them for the launch call. We call at
 * the chosen time instead of going back and forth to schedule one.
 */
export function LeadForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [callAt, setCallAt] = useState("");
  const slots = useMemo(() => callSlotOptions(), []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!callAt) {
      setError("Pick a time for us to call.");
      return;
    }
    setState("sending");
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, callAt, source: "landing-done-for-you" }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Couldn't send. Please try again.");
      }
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send. Please try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    const chosen = slots.find((slot) => slot.startsAt === callAt);
    return (
      <p role="status" className="rounded-2xl bg-white p-6 text-plum">
        Booked. We&apos;ll call {chosen ? `${chosen.dayLabel} at ${chosen.timeLabel}` : "you then"} to get your site
        started.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          Your name
          <input name="name" required maxLength={120} autoComplete="name" className={input} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Business name
          <input name="businessName" required maxLength={120} autoComplete="organization" className={input} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Email
          <input name="email" type="email" maxLength={254} autoComplete="email" className={input} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Phone or WhatsApp
          <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={input} />
        </label>
      </div>

      <div className="grid gap-1.5 text-sm">
        <span>When should we call? (UK time)</span>
        <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-hairline bg-white p-2 sm:grid-cols-2">
          {slots.map((slot) => (
            <label
              key={slot.startsAt}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                callAt === slot.startsAt ? "bg-plum text-white" : "hover:bg-hairline/40"
              }`}
            >
              <input
                type="radio"
                name="callSlot"
                value={slot.startsAt}
                checked={callAt === slot.startsAt}
                onChange={() => setCallAt(slot.startsAt)}
                className="sr-only"
              />
              {slot.dayLabel}, {slot.timeLabel}
            </label>
          ))}
        </div>
      </div>

      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {error ? <p className="text-sm text-berry">{error}</p> : null}
      <button
        type="submit"
        disabled={state === "sending"}
        className="justify-self-start rounded-full bg-plum px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-plum-soft disabled:opacity-60"
      >
        {state === "sending" ? "Booking…" : "Book the call"}
      </button>
    </form>
  );
}
