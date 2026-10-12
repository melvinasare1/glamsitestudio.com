"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { XIcon } from "lucide-react";
import { STOREFRONT_NOT_LIVE_MODAL_DISMISS_KEY } from "@/lib/verify";

export default function StorefrontNotLiveModal({ open: shouldOpen }: { open: boolean }) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(STOREFRONT_NOT_LIVE_MODAL_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(STOREFRONT_NOT_LIVE_MODAL_DISMISS_KEY, "1");
    } catch {
      /* private mode */
    }
    setDismissed(true);
  }

  const open = shouldOpen && dismissed === false;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-950/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-wire bg-white p-6 shadow-card outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Dismiss storefront not live notice"
              className="absolute top-3 right-3 rounded-full p-1.5 text-ink-700/50 transition hover:bg-mist hover:text-ink-950"
            >
              <XIcon className="size-4" />
            </button>
          </Dialog.Close>
          <Dialog.Title className="font-display text-xl font-semibold text-ink-950">
            Your website isn&apos;t live yet
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-ink-700">
            Your storefront is not public. We review every store before it goes live. Open Verify
            to finish your details and submit them for review.
          </Dialog.Description>

          <Link
            href="/dashboard/verify"
            onClick={dismiss}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            Go to Verify
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
