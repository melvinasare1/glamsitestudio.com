"use client";

import { useState } from "react";
import Link from "next/link";
import { EMAIL_QUOTA_BY_TIER, canCustomizeEmailToggles } from "@glamsite/shared/billing";
import type { EmailNotificationSettings, HostingTier } from "@glamsite/shared/types";
import { Panel } from "@/components/page";
import { Switch } from "@/components/ui/switch";
import { useAction } from "@/lib/use-action";
import { saveEmailNotificationSettings, type EmailNotificationSettingsInput } from "./actions";

const ROWS: { key: keyof EmailNotificationSettingsInput; title: string; description: string }[] = [
  {
    key: "clientBookingConfirmationEnabled",
    title: "Booking confirmation to client",
    description: "Sent to the client when they book online.",
  },
  {
    key: "ownerBookingConfirmationEnabled",
    title: "Booking confirmation to you",
    description: "Sent to you when a client books online.",
  },
  {
    key: "clientCancellationEnabled",
    title: "Cancellation to client",
    description: "Sent to the client when an appointment is cancelled.",
  },
  {
    key: "ownerCancellationEnabled",
    title: "Cancellation to you",
    description: "Sent to you when a client cancels online.",
  },
];

export function EmailNotificationsForm({
  settings,
  sentCount,
  hostingTier,
}: {
  settings: EmailNotificationSettings | null;
  sentCount: number;
  hostingTier: HostingTier;
}) {
  const { run } = useAction();
  const canCustomize = canCustomizeEmailToggles(hostingTier);
  const quota = EMAIL_QUOTA_BY_TIER[hostingTier];
  const [form, setForm] = useState<EmailNotificationSettingsInput>({
    clientBookingConfirmationEnabled: settings?.clientBookingConfirmationEnabled ?? true,
    ownerBookingConfirmationEnabled: settings?.ownerBookingConfirmationEnabled ?? true,
    clientCancellationEnabled: settings?.clientCancellationEnabled ?? true,
    ownerCancellationEnabled: settings?.ownerCancellationEnabled ?? true,
  });

  return (
    <Panel title="Email notifications" description={`${sentCount} of ${quota} emails used this month.`}>
      <ul className="grid gap-2">
        {ROWS.map((row) => (
          <li key={row.key} className="flex items-start justify-between gap-4 rounded-xl border border-black/8 p-4 text-sm">
            <span>
              <span className="block font-medium">{row.title}</span>
              <span className="mt-0.5 block text-muted-foreground">{row.description}</span>
            </span>
            <Switch
              checked={canCustomize ? form[row.key] : true}
              disabled={!canCustomize}
              onCheckedChange={(checked) => {
                const next = { ...form, [row.key]: checked };
                setForm(next);
                run(() => saveEmailNotificationSettings(next), "Email settings saved");
              }}
            />
          </li>
        ))}
      </ul>
      {!canCustomize ? (
        <p className="mt-4 text-sm text-muted-foreground">
          All four emails are always on with the Basic plan.{" "}
          <Link href="/support" className="font-medium text-foreground underline underline-offset-4">
            Talk to us
          </Link>{" "}
          about upgrading to choose which ones send.
        </p>
      ) : null}
    </Panel>
  );
}
