import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sectionText } from "@glamsite/shared/site-content";
import { loadSite } from "@/lib/site";
import { SiteRenderer } from "@/templates";
import { siteTitle } from "@/templates/shared";

/** Owners' edits show within a minute without rebuilding. */
export const revalidate = 60;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await loadSite(params.slug);
  if (!data) return { title: "Site not found" };
  const { business } = data;
  const description = sectionText(business.content, "seo", "description") || undefined;
  const image =
    sectionText(business.content, "seo", "shareImage") || sectionText(business.content, "hero", "image") || undefined;
  return {
    title: siteTitle(business),
    description,
    openGraph: { title: siteTitle(business), description, images: image ? [image] : undefined },
  };
}

export default async function SitePage({ params }: Props) {
  const data = await loadSite(params.slug);
  if (!data) notFound();
  return <SiteRenderer data={data} />;
}
