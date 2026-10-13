"use client";

import { useState } from "react";

const input =
  "w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-plum outline-none placeholder:text-mauve/60 focus:border-berry focus:ring-1 focus:ring-berry";

/** Done-for-you enquiries → /api/leads. */
export function LeadForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setState("sending");
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "landing-done-for-you" }),
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
    return (
      <p role="status" className="rounded-2xl bg-white p-6 text-plum">
        Thanks. We&apos;ll be in touch within one working day to book your launch call.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
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
      <label className="grid gap-1.5 text-sm">
        Anything we should know?
        <textarea name="message" rows={3} maxLength={2000} placeholder="e.g. I'm a lash tech in Leeds and I use Fresha for bookings" className={input} />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {error ? <p className="text-sm text-berry">{error}</p> : null}
      <button
        type="submit"
        disabled={state === "sending"}
        className="justify-self-start rounded-full bg-plum px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-plum-soft disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Ask us to set it up"}
      </button>
    </form>
  );
}
