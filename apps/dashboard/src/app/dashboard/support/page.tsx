"use client";

import { useState } from "react";
import { useSeller } from "@/lib/seller-context";
import { SUPPORT_SUBJECTS, type SupportSubject } from "@/lib/support";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-black/8 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand";

export default function SupportPage() {
  const { seller, user } = useSeller();
  const [name, setName] = useState(seller?.businessName ?? "");
  const [email, setEmail] = useState(seller?.email || user?.email || "");
  const [phone, setPhone] = useState(seller?.phone ?? "");
  const [subject, setSubject] = useState<SupportSubject | "">("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim() || !subject || !message.trim()) {
      setError("Fill in every field before sending.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject,
          message: message.trim(),
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error || "Couldn't send your ticket. Try again in a moment.");
        return;
      }
      setSent(true);
    } catch {
      setError("Couldn't send your ticket. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl px-4 py-4 md:py-6 lg:px-6">
      <p className="text-sm text-muted-foreground">
        Something broken, a question, or an idea? Send it through and we&apos;ll get back to you.
      </p>

      {sent ? (
        <section className="mt-6 rounded-xl border border-black/8 bg-white p-6">
          <h2 className="font-display text-base font-semibold text-ink-950">Ticket sent</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve got it. We&apos;ll reply to {email || "your email"} as soon as we can.
          </p>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-black/8 bg-white p-6">
          <h2 className="font-display text-base font-semibold text-ink-950">New ticket</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Name, email, and phone come from your seller profile. Edit them if you want us to use a
            different contact.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink-950">Name</span>
              <input
                name="name"
                type="text"
                required
                maxLength={120}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink-950">Email</span>
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink-950">Contact number</span>
              <input
                name="phone"
                type="tel"
                required
                maxLength={40}
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink-950">Subject</span>
              <select
                name="subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value as SupportSubject | "")}
                className={fieldClass}
              >
                <option value="" disabled>
                  Select a subject
                </option>
                {SUPPORT_SUBJECTS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink-950">Message</span>
              <textarea
                name="message"
                required
                rows={6}
                maxLength={8000}
                placeholder="What do you need help with?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={fieldClass}
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className="mt-6 rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-800 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send ticket"}
          </button>
        </form>
      )}
    </div>
  );
}
