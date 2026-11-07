import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadDraftSite } from "@/lib/site";
import { SiteRenderer } from "@/templates";

/** Always re-check the token; never cache a draft page. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Site preview", robots: { index: false, follow: false } };

type Props = { params: { slug: string; token: string } };

/**
 * An owner's private preview link for their draft site: /{slug}/preview/{token}
 * (linked from the dashboard's publish panel). Gated on businesses.preview_token,
 * not a login session — see loadDraftSite. Nobody else can see a draft site;
 * businesses_read RLS still only lets anon visitors see status = 'live' rows.
 */
export default async function PreviewPage({ params }: Props) {
  const data = await loadDraftSite(params.slug, params.token);
  if (!data) notFound();

  return (
    <>
      <div className="bg-neutral-900 px-4 py-2 text-center text-xs text-white">
        You&apos;re previewing <strong>{data.business.name}</strong>. Only people with this link can see it &mdash;
        it&apos;s not live yet.
      </div>
      <SiteRenderer data={data} />
    </>
  );
}
