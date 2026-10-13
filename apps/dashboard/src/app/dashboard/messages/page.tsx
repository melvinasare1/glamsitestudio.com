import { enquiryFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { MessagesList } from "./messages-list";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const { business } = await requireBusiness();
  const supabase = await createClient();
  const { data } = await supabase
    .from("enquiries")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <PageHeader title="Messages" description="Sent from the contact form on your site." />
      <PageBody>
        <MessagesList enquiries={(data ?? []).map(enquiryFromRow)} />
      </PageBody>
    </>
  );
}
