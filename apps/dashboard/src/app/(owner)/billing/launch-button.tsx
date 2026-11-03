"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startLaunchCheckout } from "./actions";

/**
 * Redirects to Stripe Checkout for $1 for the first 3 months of hosting — the one
 * thing gated on payment. Same redirect-and-leave pattern as
 * ManageBillingButton and ConnectStripeButton.
 */
export function LaunchButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await startLaunchCheckout();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div className="mt-5">
      <Button disabled={pending} onClick={onClick}>
        {pending ? "Taking you to payment…" : "Launch: $1 for 3 months"}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
