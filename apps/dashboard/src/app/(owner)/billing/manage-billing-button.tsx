"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createBillingPortalSession } from "./actions";

/**
 * Redirects to Stripe's Customer Portal, so it can't reuse the shared
 * useAction toast-and-refresh flow — success means leaving the page.
 */
export function ManageBillingButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await createBillingPortalSession();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div className="mt-5">
      <Button variant="outline" disabled={pending} onClick={onClick}>
        {pending ? "Opening billing…" : "Manage billing"}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
