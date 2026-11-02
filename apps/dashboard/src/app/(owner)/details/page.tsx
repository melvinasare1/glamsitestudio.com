import { platformHostForSlug } from "@glamsite/shared/domain";
import { PageBody, PageHeader, Panel } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { DetailsForm } from "./details-form";

export const dynamic = "force-dynamic";

export default async function DetailsPage() {
  const { business } = await requireBusiness();
  return (
    <>
      <PageHeader title="Business details" />
      <PageBody>
        <DetailsForm business={business} />
        <Panel title="Web address">
          <p className="text-sm">
            Your site is at <span className="font-medium">{platformHostForSlug(business.slug)}</span>
            {business.customDomain ? (
              <>
                {" "}and <span className="font-medium">{business.customDomain}</span>
                {business.customDomainVerified ? "" : " (waiting for DNS)"}
              </>
            ) : null}
            .
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Connecting your own domain from here is coming soon. Until then, contact support and we&apos;ll set it up.
          </p>
        </Panel>
      </PageBody>
    </>
  );
}
