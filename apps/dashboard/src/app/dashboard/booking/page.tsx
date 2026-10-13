import { PageBody, PageHeader } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { BookingForm } from "./booking-form";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const { business } = await requireBusiness();
  return (
    <>
      <PageHeader title="Booking" />
      <PageBody>
        <BookingForm business={business} />
      </PageBody>
    </>
  );
}
