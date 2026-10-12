"use client";

import { useState, type FormEvent } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fieldClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[#e4e8ef] bg-white px-4 text-sm text-[#1a1f2b] outline-none placeholder:text-[#66707e] focus:border-[#1266b5]";

export function ImportsContactForm({ storeSlug }: { storeSlug: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const nameTrimmed = name.trim();
    const emailTrimmed = email.trim().toLowerCase();
    const messageTrimmed = message.trim();

    if (!nameTrimmed) {
      setError("Please enter your name.");
      return;
    }
    if (!emailTrimmed || !EMAIL_RE.test(emailTrimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!messageTrimmed) {
      setError("Please enter a message.");
      return;
    }
    if (!storeSlug) {
      setError("This store isn't accepting messages yet.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          name: nameTrimmed,
          email: emailTrimmed,
          message: messageTrimmed,
        }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(body?.error || "Could not send your message. Please try again.");
        setSubmitting(false);
        return;
      }
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError("Could not send your message. Please try again.");
    }
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-[#e4e8ef] bg-white px-6 py-10 text-center">
        <p className="text-xl font-semibold tracking-tight text-[#1a1f2b]">Message sent</p>
        <p className="mt-2 text-sm leading-relaxed text-[#66707e]">
          Thanks. We&apos;ll get back to you as soon as we can.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-[#1266b5] px-6 text-sm font-medium text-white hover:bg-[#0d4c88]"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#1a1f2b]">
          Name
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-medium text-[#1a1f2b]">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-medium text-[#1a1f2b]">
          Message
          <textarea
            name="message"
            required
            rows={6}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="mt-1.5 w-full resize-y rounded-lg border border-[#e4e8ef] bg-white px-4 py-3 text-sm text-[#1a1f2b] outline-none placeholder:text-[#66707e] focus:border-[#1266b5]"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#1266b5] px-8 text-sm font-medium text-white hover:bg-[#0d4c88] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
