"use client";

import { useState, useTransition } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/lib/business-context";
import { useAction } from "@/lib/use-action";
import { setPublished } from "./actions";
import { startLaunchCheckout } from "./billing/actions";

/**
 * Before the first payment: a "Launch" CTA instead of "Publish" — the only
 * thing gated on payment. Everything else in the dashboard is open from
 * sign-up. After launch, publish/unpublish is free, same as before.
 */
export function PublishPanel({ ready, launched }: { ready: boolean; launched: boolean }) {
  const { business, siteUrl, previewUrl } = useBusiness();
  const { pending, run } = useAction();
  const [launchPending, startLaunchTransition] = useTransition();
  const [launchError, setLaunchError] = useState<string | null>(null);
  const live = business.status === "live";

  if (!launched) {
    return (
      <Panel
        title="Launch your site"
        description={
          ready
            ? "Everything essential is in place. Launch when you're happy. $1 for your first 3 months of hosting."
            : "Finish the essentials below, or launch now and keep editing. $1 for your first 3 months of hosting."
        }
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon /> Preview
              </a>
            </Button>
            <Button
              size="lg"
              loading={launchPending}
              onClick={() => {
                setLaunchError(null);
                startLaunchTransition(async () => {
                  const result = await startLaunchCheckout();
                  if (!result.ok) {
                    setLaunchError(result.error);
                    return;
                  }
                  window.location.href = result.url;
                });
              }}
            >
              {launchPending ? "Taking you to payment…" : "Launch: $1 for 3 months"}
            </Button>
          </div>
        }
      >
        <p className="text-sm">
          Your site will be at <span className="font-medium">{siteUrl.replace(/^https:\/\//, "")}</span> once it's
          live. Nobody can see it until then &mdash; use Preview above to see it now.
        </p>
        {launchError ? <p className="mt-2 text-sm text-destructive">{launchError}</p> : null}
      </Panel>
    );
  }

  return (
    <Panel
      title={live ? "Your site is live" : "Your site is in draft"}
      description={
        live
          ? "Anyone can see it. Changes you save appear within a minute."
          : ready
            ? "Everything essential is in place. Publish when you're happy."
            : "Finish the essentials below, then publish. You can still publish now and keep editing."
      }
      actions={
        live ? (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon /> View site
              </a>
            </Button>
            <Button variant="ghost" loading={pending}
              onClick={() => {
                if (window.confirm("Take your site offline? Visitors will see a 'not found' page until you publish again.")) {
                  run(() => setPublished(false), "Site unpublished");
                }
              }}>
              Unpublish
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon /> Preview
              </a>
            </Button>
            <Button size="lg" loading={pending} onClick={() => run(() => setPublished(true), "Your site is live")}>
              {pending ? "Publishing…" : "Publish site"}
            </Button>
          </div>
        )
      }
    >
      <p className="text-sm">
        Address: <span className="font-medium">{siteUrl.replace(/^https:\/\//, "")}</span>
      </p>
    </Panel>
  );
}
