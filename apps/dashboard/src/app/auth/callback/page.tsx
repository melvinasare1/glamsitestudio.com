"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/auth-frame";
import { createClient } from "@glamsite/shared/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) {
      router.replace("/login");
      return;
    }

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        window.history.replaceState(null, "", "/auth/callback");
        router.replace(type === "recovery" ? "/auth/reset-password" : "/dashboard");
        router.refresh();
      })
      .catch(() => {
        setError("Could not start your dashboard session.");
      });
  }, [router]);

  return (
    <AuthFrame kicker="Seller access" title={error ? "Could not sign you in" : "Signing you in"}>
      <p className="mt-6 text-sm text-ink-700">{error ?? "One moment…"}</p>
    </AuthFrame>
  );
}
