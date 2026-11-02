"use client";

import { ExternalLinkIcon } from "lucide-react";
import { Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/lib/business-context";
import { useAction } from "@/lib/use-action";
import { setPublished } from "./actions";

export function PublishPanel({ ready }: { ready: boolean }) {
  const { business, siteUrl } = useBusiness();
  const { pending, run } = useAction();
  const live = business.status === "live";

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
            <Button variant="ghost" disabled={pending}
              onClick={() => {
                if (window.confirm("Take your site offline? Visitors will see a 'not found' page until you publish again.")) {
                  run(() => setPublished(false), "Site unpublished");
                }
              }}>
              Unpublish
            </Button>
          </div>
        ) : (
          <Button size="lg" disabled={pending} onClick={() => run(() => setPublished(true), "Your site is live")}>
            {pending ? "Publishing…" : "Publish site"}
          </Button>
        )
      }
    >
      <p className="text-sm">
        Address: <span className="font-medium">{siteUrl.replace(/^https:\/\//, "")}</span>
      </p>
    </Panel>
  );
}
