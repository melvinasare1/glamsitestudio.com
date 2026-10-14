"use client";

import { useState } from "react";

/** Shared by every template. Posts to /api/contact, which files it under the business's enquiries. */
export function ContactForm({ slug, demo = false }: { slug: string; demo?: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (demo) {
      setState("sent");
      return;
    }
    setState("sending");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...Object.fromEntries(form.entries()) }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Could not send your message.");
      }
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <p role="status" className="rounded-lg bg-[var(--accent)] px-5 py-4 text-sm">
        Thanks, your message has been sent. We&apos;ll get back to you soon.
      </p>
    );
  }

  const input =
    "w-full rounded-md border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]";

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="grid gap-1 text-sm">
        Name
        <input name="name" required maxLength={120} autoComplete="name" className={input} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Email
          <input name="email" type="email" maxLength={254} autoComplete="email" className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          Phone
          <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={input} />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        Message
        <textarea name="message" required rows={4} maxLength={4000} className={input} />
      </label>
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={state === "sending"}
        className="justify-self-start rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
