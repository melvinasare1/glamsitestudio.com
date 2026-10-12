"use client";

import { useState } from "react";
import { trackGaEvent } from "@/lib/ga";

const categories = [
  "Fashion & accessories",
  "Beauty & cosmetics",
  "Phone & tech accessories",
  "Home & lifestyle goods",
  "Baby products",
  "Stationery / books / hobby",
  "Other",
];

const fieldClassName =
  "mt-2 w-full rounded-lg border border-wire bg-white px-4 py-3 text-ink-950 outline-none focus:border-navy";

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Something went wrong. Try again.");
      trackGaEvent("generate_lead", {
        method: "signup_form",
        product_category: String(payload.productCategory ?? ""),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-ink-950">
        <div className="max-w-md text-center">
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-navy">You&apos;re on the list</p>
          <h1 className="mt-4 font-display text-3xl font-semibold">Thanks. We&apos;ll be in touch.</h1>
          <p className="mt-3 text-ink-700">
            We&apos;re lining up the first cohort now. We&apos;ll reach out on the number you gave us as soon
            as we&apos;re ready to onboard.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-24 text-ink-950">
      <div className="mx-auto max-w-lg">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-navy">Early access</p>
        <h1 className="mt-4 font-display text-3xl font-semibold">Tell us about your business</h1>
        <p className="mt-3 text-ink-700">
          Two minutes, no commitment. We use this to line up the first cohort and confirm pricing works
          for real sellers before we launch.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <Field label="Business name" name="businessName" required />
          <Field label="Your name" name="contactName" required />
          <Field label="Phone number" name="phone" type="tel" required />
          <Field label="Email" name="email" type="email" required />

          <label className="block">
            <span className="text-sm text-ink-700">Product category</span>
            <select name="productCategory" required className={fieldClassName}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Roughly how many orders a month?"
            name="estimatedMonthlyOrders"
            type="number"
          />

          <label className="block">
            <span className="text-sm text-ink-700">Anything else we should know?</span>
            <textarea name="notes" rows={3} className={fieldClassName} />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-navy px-7 py-3 font-medium text-white transition hover:bg-navy/90 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Get your website"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-ink-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className={fieldClassName}
      />
    </label>
  );
}
