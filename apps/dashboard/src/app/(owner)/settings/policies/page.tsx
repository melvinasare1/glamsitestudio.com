import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { PoliciesForm } from "./policies-form";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const { business } = await requireBusiness();
  return (
    <>
      <PageHeader
        title="Policies and terms"
        description="Not shown on your site yet — this just saves your own copy for now."
      />
      <PageBody>
        <PoliciesForm business={business} />
      </PageBody>
    </>
  );
}
