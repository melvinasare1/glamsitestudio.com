"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AUTH_INPUT_CLASS, AuthFrame } from "@/components/auth-frame";
import { createClient } from "@glamsite/shared/supabase/client";
import { getDashboardUrl } from "@glamsite/shared/supabase/env";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const form = e.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setError(null);
    setNotice(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email first, then reset your password.");
      return;
    }

    setResetting(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${getDashboardUrl()}/auth/confirm?next=${encodeURIComponent("/auth/reset-password")}`,
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setNotice("Check your inbox for a link to choose a new password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a reset email.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <AuthFrame
      kicker="Glam Site Studios"
      title="Log in to your dashboard"
      description="Log in to edit your website."
    >
      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-2xl border border-black/8 bg-white p-6 shadow-card"
      >
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </label>

        <div>
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={AUTH_INPUT_CLASS}
            />
          </label>
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading || resetting}
            className="mt-2 text-sm font-medium text-navy hover:underline disabled:opacity-50"
          >
            {resetting ? "Sending reset email…" : "Reset password"}
          </button>
        </div>

        {error ? <p className="text-sm text-delta-down">{error}</p> : null}
        {notice ? <p className="text-sm text-delta-up">{notice}</p> : null}

        <button
          type="submit"
          disabled={loading || resetting}
          className="w-full rounded-full bg-navy px-6 py-2.5 text-sm font-medium text-white transition hover:bg-navy/90 disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-medium text-navy hover:underline">
          Get your website
        </Link>
      </p>
    </AuthFrame>
  );
}
