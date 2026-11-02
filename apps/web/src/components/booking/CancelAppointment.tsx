"use client";

import { useState } from "react";

/** Two-step cancel, so a stray tap doesn't cancel someone's appointment. */
export function CancelAppointment({ token }: { token: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Couldn't cancel. Please try again.");
        return;
      }
      // Reload so the whole page shows the cancelled appointment.
      window.location.reload();
      return;
    } catch {
      setError("Couldn't cancel. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {confirming ? (
        <div className="rounded-xl border border-[#ece6e3] p-4">
          <p className="font-medium">Cancel this appointment?</p>
          <p className="mt-1 text-sm text-[#6e6468]">The time will be offered to other clients.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="rounded-full bg-[#9b1c1c] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Cancelling…" : "Yes, cancel it"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-full border border-[#d9d1cd] px-5 py-2.5 text-sm font-medium hover:border-[#1f1a1c]"
            >
              Keep my appointment
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full border border-[#d9d1cd] px-6 py-3 text-sm font-medium hover:border-[#1f1a1c]"
        >
          Cancel appointment
        </button>
      )}
      {error ? (
        <p className="mt-3 rounded-lg bg-[#fff1f0] px-4 py-3 text-sm text-[#9b1c1c]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
