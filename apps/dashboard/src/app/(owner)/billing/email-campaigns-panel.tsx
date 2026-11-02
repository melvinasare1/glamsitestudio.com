import Link from "next/link";
import { Panel } from "@/components/page";

/** Premium-only entry point. No composer yet — see Support to plan a send by hand. */
export function EmailCampaignsPanel() {
  return (
    <Panel title="Email campaigns">
      <p className="text-sm text-muted-foreground">
        Composing and sending marketing emails to your clients from here is coming soon. Until then, your dedicated
        account manager can help you plan one — just reach out from{" "}
        <Link href="/support" className="font-medium text-foreground underline underline-offset-4">
          Support
        </Link>
        .
      </p>
    </Panel>
  );
}
