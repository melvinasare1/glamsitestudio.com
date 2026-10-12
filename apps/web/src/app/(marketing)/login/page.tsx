"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@glamsite/shared/supabase/client";
import { getDashboardUrl } from "@glamsite/shared/supabase/env";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const password = String(new FormData(form).get("password") ?? "");

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "No account found for that email and password."
            : signInError.message
        );
        return;
      }
      if (!data.session) {
        setError("This account needs to confirm email before logging in.");
        return;
      }

      const hash = new URLSearchParams({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }).toString();
      window.location.assign(`${getDashboardUrl()}/auth/callback#${hash}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-24 text-ink-950">
      <div className="mx-auto max-w-lg">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-navy">Seller access</p>
        <h1 className="mt-4 font-display text-3xl font-semibold">Log in to your dashboard</h1>
        <p className="mt-3 text-ink-700">
          Use the email and password for your Glam Site Studios seller account.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <label className="block">
            <span className="text-sm text-ink-700">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-wire bg-white px-4 py-3 text-ink-950 outline-none focus:border-navy"
            />
          </label>

          <label className="block">
            <span className="text-sm text-ink-700">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-wire bg-white px-4 py-3 text-ink-950 outline-none focus:border-navy"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-navy px-7 py-3 font-medium text-white transition hover:bg-navy/90 disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-8 text-sm text-ink-700">
          Not onboarded yet?{" "}
          <Link href={`${getDashboardUrl()}/signup-seller`} className="text-navy underline underline-offset-4">
            Get your website
          </Link>
        </p>
      </div>
    </main>
  );
}
