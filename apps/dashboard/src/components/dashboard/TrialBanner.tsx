"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { XIcon } from "lucide-react";
import { trialBannerMessage, TRIAL_BANNER_DISMISS_KEY, type TrialBannerState } from "@/lib/trial";
import { cn } from "@/lib/utils";

export default function TrialBanner({ trial }: { trial: TrialBannerState | null }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(TRIAL_BANNER_DISMISS_KEY) === "1");
    } catch {
      /* private mode */
    }
  }, []);

  if (!trial || dismissed) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(TRIAL_BANNER_DISMISS_KEY, "1");
    } catch {
      /* private mode */
    }
    setDismissed(true);
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5 lg:px-6",
        trial.expired
          ? "border-delta-down/20 bg-delta-down-soft text-delta-down"
          : "border-brand/20 bg-brand-soft text-ink-950"
      )}
    >
      <p className="min-w-0 text-sm font-medium">{trialBannerMessage(trial)}</p>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/dashboard/billing"
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium text-white transition",
            trial.expired ? "bg-delta-down hover:bg-delta-down/90" : "bg-brand hover:bg-brand/90"
          )}
        >
          Upgrade
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss trial notice"
          className={cn(
            "rounded-full p-1.5 transition",
            trial.expired
              ? "text-delta-down/70 hover:bg-delta-down/10 hover:text-delta-down"
              : "text-ink-700/50 hover:bg-white/70 hover:text-ink-950"
          )}
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
