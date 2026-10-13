import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoSiteData } from "@glamsite/shared/demo";
import { TEMPLATES, getTemplate, isTemplateId } from "@glamsite/shared/templates";
import { SiteRenderer } from "@/templates";

type Props = { params: { template: string }; searchParams?: { embed?: string } };

export function generateStaticParams() {
  return TEMPLATES.map((template) => ({ template: template.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isTemplateId(params.template)) return { title: "Template not found" };
  return {
    title: `${getTemplate(params.template).name} template demo · Glam Site Studios`,
    robots: { index: false },
  };
}

/** Live preview of a template with demo content, linked from the template gallery. */
export default function DemoPage({ params, searchParams }: Props) {
  if (!isTemplateId(params.template)) notFound();
  const template = getTemplate(params.template);
  // ?embed=1 is the phone preview on the landing page: no banner.
  if (searchParams?.embed === "1") return <SiteRenderer data={demoSiteData(template.id)} demo />;
  return (
    <>
      <div className="bg-neutral-900 px-4 py-2 text-center text-xs text-white">
        You&apos;re viewing the <strong>{template.name}</strong> template with demo content.{" "}
        <a href="/" className="underline underline-offset-2">
          Back to Glam Site Studios
        </a>
      </div>
      <SiteRenderer data={demoSiteData(template.id)} demo />
    </>
  );
}
