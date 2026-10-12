"use client";

import Link from "next/link";
import { STOREFRONT_TEMPLATE_OPTIONS } from "@/lib/storefront-templates";
import { useSeller } from "@/lib/seller-context";
import {
  hasConnectedStoreDomain,
  namecheapAffiliateUrl,
  storefrontUrl,
} from "@/lib/storefront-url";
import { connectedStoreHost, publicStorefrontUrlFromHost } from "@glamsite/shared/store-domain";
import { SettingsFaqs } from "@/components/dashboard/SettingsFaqs";

const templateLabels = Object.fromEntries(
  STOREFRONT_TEMPLATE_OPTIONS.map((option) => [option.id, option.name])
) as Record<(typeof STOREFRONT_TEMPLATE_OPTIONS)[number]["id"], string>;

const tierLabels = {
  website_admin: "Website & Admin",
  fulfilment: "Fulfilment",
} as const;

export default function SettingsPage() {
  const { seller } = useSeller();
  const storeUrl = storefrontUrl(seller);
  const connectedHost = connectedStoreHost(seller?.domain);
  const domainConnected = hasConnectedStoreDomain(seller);
  const liveStoreUrl = connectedHost ? publicStorefrontUrlFromHost(connectedHost) : null;
  const buyDomainUrl = namecheapAffiliateUrl();

  const templateLabel = seller ? templateLabels[seller.template] : "Not set";
  const billingLabel = seller
    ? `${tierLabels[seller.pricingTier]}, GHS ${seller.baseFeeCedis}/mo base`
    : "Not set";

  return (
    <div className="max-w-2xl px-4 py-4 md:py-6 lg:px-6">
      <p className="text-sm text-ink-700/50">Your business info and storefront setup.</p>

      <section className="mt-6 rounded-xl border border-wire bg-white p-6">
        <h2 className="font-display text-base font-semibold text-ink-950">Business</h2>
        <div className="mt-4 space-y-4">
          <SettingRow label="Business name" value={seller?.businessName || "Not set"} />
          <SettingRow label="Template" value={templateLabel} />
          <SettingRow
            label="Online store"
            value={storeUrl ? "View store" : "Not set up yet"}
            hint={
              domainConnected
                ? "Opens your public shop in a new tab"
                : "Opens the preview storefront for testing. It is not your public URL until a domain is connected."
            }
            href={storeUrl}
          />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-wire bg-white p-6">
        <h2 className="font-display text-base font-semibold text-ink-950">Domain</h2>
        {domainConnected && connectedHost && liveStoreUrl ? (
          <>
            <p className="mt-3 text-sm text-ink-700">
              Your store is live at{" "}
              <a
                href={liveStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand hover:underline"
              >
                {connectedHost}
              </a>
              .
            </p>
            <p className="mt-2 text-sm text-ink-700/60">
              This is the address buyers use. Need to change it?{" "}
              <Link href="/dashboard/support" className="font-medium text-brand hover:underline">
                Message us
              </Link>{" "}
              and we&apos;ll update it.
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-medium text-ink-950">No domain connected yet</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-700/60">
              Domains are set up manually for now. Contact us once you&apos;ve bought a domain
              and we&apos;ll get it connected.
            </p>
            {buyDomainUrl ? (
              <a
                href={buyDomainUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-800"
              >
                Don&apos;t have a domain? Buy one here
              </a>
            ) : null}
            <p className="mt-4 text-sm leading-relaxed text-ink-700/60">
              Once you&apos;ve bought your domain,{" "}
              <Link href="/dashboard/support" className="font-medium text-brand hover:underline">
                message us
              </Link>{" "}
              with it and we&apos;ll connect it to your store within a day or two. Buying a
              domain does not connect it automatically.
            </p>
          </>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-wire bg-white p-6">
        <h2 className="font-display text-base font-semibold text-ink-950">Billing</h2>
        <div className="mt-4 space-y-4">
          <SettingRow label="Pricing tier" value={billingLabel} />
          <SettingRow label="Included orders" value="20 orders / month" />
          <SettingRow label="Overage rate" value="3 GHS / order (21–50), then tiered down" />
          <SettingRow
            label="Pay for your plan"
            value="Pay by MoMo"
            hint="Send Mobile Money to Glam Site Studios using your billing reference"
            href="/dashboard/billing"
          />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-wire bg-white p-6">
        <h2 className="font-display text-base font-semibold text-ink-950">Verify</h2>
        <p className="mt-2 text-sm text-ink-700/60">
          Identity documents, return policy, and publishing live on Verify.
        </p>
        <Link
          href="/dashboard/verify"
          className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
        >
          Open Verify
        </Link>
      </section>

      <SettingsFaqs />
    </div>
  );
}

function SettingRow({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string | null;
}) {
  return (
    <div className="flex items-center justify-between border-b border-wire pb-4 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-ink-950">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-ink-700/40">{hint}</p> : null}
      </div>
      {href ? (
        <a
          href={href}
          {...(href.startsWith("/")
            ? {}
            : { target: "_blank", rel: "noopener noreferrer" })}
          className="text-sm font-medium text-brand hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm text-ink-700/70">{value}</p>
      )}
    </div>
  );
}
