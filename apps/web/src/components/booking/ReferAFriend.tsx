"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

/** Shown on a client's manage-appointment page when the salon has a referral reward turned on. */
export function ReferAFriend({ link, rewardText }: { link: string; rewardText: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the link is still selectable text below.
    }
  }

  return (
    <div className="mt-10 rounded-xl bg-[#f7f4f2] px-4 py-4 text-sm">
      <p className="font-medium">Refer a friend, earn a reward</p>
      <p className="mt-1 text-[#4a4145]">
        Share your link. Once a friend you refer completes their first appointment, {rewardText}.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={link}
          onFocus={(event) => event.target.select()}
          className="min-w-0 flex-1 rounded-lg border border-[#d9d1cd] bg-white px-3 py-2 text-[#1f1a1c]"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d9d1cd] px-4 py-2 font-medium hover:border-[#1f1a1c]"
        >
          {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
