"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AUTH_INPUT_CLASS, AuthFrame } from "@/components/auth-frame";
import { createClient } from "@glamsite/shared/supabase/client";

const EXPIRED_LINK =
  "This reset link is invalid or expired. Request a new one from the login page.";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function establishSession() {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const urlError =
        searchParams.get("error") ||
        hashParams.get("error_description") ||
        hashParams.get("error");

      if (urlError) {
        if (!cancelled) {
          setLinkError(urlError.replace(/\+/g, " "));
          setReady(true);
        }
        return;
      }

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      if (code || (tokenHash && type)) {
        const confirm = new URL("/auth/confirm", window.location.origin);
        if (code) confirm.searchParams.set("code", code);
        if (tokenHash) confirm.searchParams.set("token_hash", tokenHash);
        if (type) confirm.searchParams.set("type", type);
        confirm.searchParams.set("next", "/auth/reset-password");
        window.location.replace(confirm.toString());
        return;
      }

      const supabase = createClient();
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;
        if (sessionError) {
          setLinkError(sessionError.message);
          setReady(true);
          return;
        }
        window.history.replaceState(null, "", "/auth/reset-password");
        setReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        setLinkError(EXPIRED_LINK);
      }
      setReady(true);
    }

    void establishSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");
    const confirm = String(new FormData(form).get("confirm") ?? "");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <AuthFrame kicker="Seller access" title="Reset your password">
        <p className="mt-6 text-sm text-ink-700">Checking your reset link…</p>
      </AuthFrame>
    );
  }

  if (linkError) {
    return (
      <AuthFrame kicker="Seller access" title="Reset your password" description={linkError}>
        <p className="mt-8 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-navy hover:underline">
            Back to login
          </Link>
        </p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      kicker="Seller access"
      title="Choose a new password"
      description="This updates the password for your seller dashboard."
    >
      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-2xl border border-black/8 bg-white p-6 shadow-card"
      >
        <label className="block">
          <span className="text-sm font-medium">New password</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={AUTH_INPUT_CLASS}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Confirm password</span>
          <input
            name="confirm"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={AUTH_INPUT_CLASS}
          />
        </label>

        {error ? <p className="text-sm text-delta-down">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-navy px-6 py-2.5 text-sm font-medium text-white transition hover:bg-navy/90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save password"}
        </button>
      </form>
    </AuthFrame>
  );
}
