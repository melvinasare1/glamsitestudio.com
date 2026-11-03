"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startConnectOnboarding } from "./actions";

/**
 * Redirects to Stripe's hosted Connect onboarding, so it can't reuse the
 * shared useAction toast-and-refresh flow — success means leaving the page.
 */
export function ConnectStripeButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await startConnectOnboarding();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div className="mt-5">
      <Button variant="outline" loading={pending} onClick={onClick}>
        {pending ? "Opening Stripe…" : label}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
