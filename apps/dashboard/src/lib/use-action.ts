"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "./business";

/** Run a server action with a pending state, a toast and a refresh of server data. */
export function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, success?: string, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (success) toast.success(success);
      onSuccess?.();
      router.refresh();
    });
  }

  return { pending, run };
}
