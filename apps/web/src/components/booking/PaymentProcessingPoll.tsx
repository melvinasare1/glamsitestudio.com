"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const POLL_MS = 3000;
const MAX_POLLS = 10; // ~30s, well past normal webhook latency

/**
 * Shown on the appointment page while a Checkout payment is still being
 * reconciled (apps/web/src/app/sites/[slug]/appointment/[token]/page.tsx's
 * paymentPending). Re-renders the server page every few seconds until the
 * deposit shows as paid, instead of leaving the client looking at a bare
 * "pending" status with no explanation.
 */
export function PaymentProcessingPoll() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt >= MAX_POLLS) return;
    const timer = setTimeout(() => {
      router.refresh();
      setAttempt((n) => n + 1);
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [attempt, router]);

  const timedOut = attempt >= MAX_POLLS;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#ece6e3] bg-[#f7f4f2] px-4 py-4 text-sm text-[#4a4145]">
      {timedOut ? (
        <p>
          This is taking longer than usual. We&apos;ll email you once it&apos;s confirmed &mdash; or{" "}
          <button type="button" onClick={() => router.refresh()} className="underline underline-offset-2">
            refresh this page
          </button>{" "}
          in a moment.
        </p>
      ) : (
        <>
          <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden />
          <p>Just a moment while we confirm your payment with Stripe. This page will update on its own.</p>
        </>
      )}
    </div>
  );
}
