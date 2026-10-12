"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { XIcon } from "lucide-react";
import type { AnsaaMomoDetails } from "@/lib/billing";
import { TRIAL_EXPIRY_MODAL_DISMISS_KEY } from "@/lib/trial";

export default function TrialExpiryModal({
  open: shouldOpen,
  billingReference,
  momo,
}: {
  open: boolean;
  billingReference: string;
  momo: AnsaaMomoDetails;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(TRIAL_EXPIRY_MODAL_DISMISS_KEY) === "1");
    } catch {
      /* private mode */
    }
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(TRIAL_EXPIRY_MODAL_DISMISS_KEY, "1");
    } catch {
      /* private mode */
    }
    setDismissed(true);
  }

  const open = shouldOpen && !dismissed;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) dismiss(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-950/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-wire bg-white p-6 shadow-card outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Dismiss trial ended notice"
              className="absolute top-3 right-3 rounded-full p-1.5 text-ink-700/50 transition hover:bg-mist hover:text-ink-950"
            >
              <XIcon className="size-4" />
            </button>
          </Dialog.Close>
          <Dialog.Title className="font-display text-xl font-semibold text-ink-950">
            Your 30-day free trial has ended
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-ink-700">
            Payment is required to continue. Send this month&apos;s fee by Mobile Money and include
            your payment reference so we can match it to your account.
          </Dialog.Description>

          <dl className="mt-5 space-y-3 rounded-xl border border-wire bg-mist px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-700/70">MoMo name</dt>
              <dd className="font-medium text-ink-950">{momo.accountName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-700/70">MoMo number</dt>
              <dd className="font-mono font-semibold text-ink-950">{momo.number}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-700/70">Your payment reference</dt>
              <dd className="font-mono text-lg font-semibold tracking-widest text-ink-950">
                {billingReference}
              </dd>
            </div>
          </dl>

          <Link
            href="/dashboard/billing"
            onClick={dismiss}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            View billing details
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
