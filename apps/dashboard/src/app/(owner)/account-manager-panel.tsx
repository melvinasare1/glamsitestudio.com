"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    tidioChatApi?: {
      open: () => void;
      messageFromVisitor: (message: string) => void;
    };
  }
}

// Bless is everyone's account manager for now; revisit once we have more
// than one person doing this (docs/follow-ups.md).
const ACCOUNT_MANAGER_NAME = "Bless Asare";
const GREETING = "Hi, I'd like to speak with Bless Asare, my account manager.";

export function AccountManagerPanel() {
  const [unavailable, setUnavailable] = useState(false);

  function openChat() {
    const api = window.tidioChatApi;
    if (!api) {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    api.open();
    api.messageFromVisitor(GREETING);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-base font-semibold text-brand">
        BA
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{ACCOUNT_MANAGER_NAME}</p>
        <p className="text-sm text-muted-foreground">
          Connecting a domain, importing your price list, or anything else slowing you down: your dedicated
          account manager is here to help you get set up and keep your site running smoothly.
        </p>
        {unavailable ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Chat isn&apos;t loaded yet.{" "}
            <Link href="/support" className="font-medium text-brand underline-offset-4 hover:underline">
              Send a message instead
            </Link>
            .
          </p>
        ) : null}
      </div>
      <Button onClick={openChat} className="shrink-0">
        <MessageCircleIcon /> Chat with {ACCOUNT_MANAGER_NAME.split(" ")[0]}
      </Button>
    </div>
  );
}
