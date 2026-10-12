"use client";

import Link from "next/link";
import { trackGaEvent } from "@/lib/ga";

const className =
  "mt-5 self-start rounded-full border border-navy px-4 py-1.5 text-sm font-medium text-navy transition hover:bg-navy hover:text-white";

function trackPreview(templateName: string) {
  trackGaEvent("template_preview", { template_name: templateName });
}

export function TemplatePreviewCta({
  templateName,
  href,
}: {
  templateName: string;
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={className} onClick={() => trackPreview(templateName)}>
        Preview
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={() => trackPreview(templateName)}>
      Preview
    </button>
  );
}
