import Link from "next/link";
import { bookingRulesFromRow, safeTimeZone } from "@glamsite/shared/booking";
import { siteLink } from "@glamsite/shared/domain";
import {
  openingHoursFromRow,
  serviceFromRow,
  staffFromRow,
  timeOffFromRow,
  workingHoursFromRow,
} from "@glamsite/shared/mappers";
import { getWebUrl } from "@glamsite/shared/supabase/env";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader, Panel } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { BookingForm } from "./booking-form";
import { RulesForm, StaffHours, TimeOffPanel } from "./booking-settings";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const { business } = await requireBusiness();
  const online = business.bookingMode === "glamsite";

  if (!online) {
    return (
      <>
        <PageHeader title="Booking" />
        <PageBody>
          <BookingForm business={business} />
        </PageBody>
      </>
    );
  }

  const supabase = await createClient();
  const [settings, staff, services, working, opening, timeOff] = await Promise.all([
    supabase.from("booking_settings").select("*").eq("business_id", business.id).maybeSingle(),
    supabase.from("staff").select("*, staff_services(service_id)").eq("business_id", business.id).order("position"),
    supabase.from("services").select("*").eq("business_id", business.id).order("position"),
    supabase.from("staff_working_hours").select("*").eq("business_id", business.id),
    supabase.from("opening_hours").select("*").eq("business_id", business.id),
    supabase
      .from("staff_time_off")
      .select("*")
      .eq("business_id", business.id)
      .gt("ends_at", new Date().toISOString())
      .order("starts_at"),
  ]);
  for (const result of [settings, staff, services, working, opening, timeOff]) {
    if (result.error) console.error("[booking] load failed", result.error.message);
  }

  const team = (staff.data ?? []).map(staffFromRow);
  const bookableServices = (services.data ?? []).map(serviceFromRow).filter((s) => s.isBookable && s.isVisible);
  const openingHours = (opening.data ?? []).map(openingHoursFromRow);
  const workingHours = (working.data ?? []).map(workingHoursFromRow);
  const hasTimes = team.some(
    (person) => person.isBookable && (workingHours.some((row) => row.staffId === person.id) || openingHours.length > 0)
  );

  const gaps = [
    !bookableServices.length && { text: "Add a service clients can book", href: "/services" },
    !team.some((person) => person.isBookable) && { text: "Add someone clients can book with", href: "/team" },
    team.some((person) => person.isBookable) && !hasTimes && { text: "Set your opening hours or someone's working hours", href: "/hours" },
    business.status !== "live" && { text: "Publish your site", href: "/" },
  ].filter(Boolean) as { text: string; href: string }[];

  const bookingUrl = siteLink(business, "/book", getWebUrl());

  return (
    <>
      <PageHeader
        title="Booking"
        description={
          <>
            Clients book on{" "}
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-4">
              your booking page
            </a>
            . New bookings appear in <Link href="/appointments" className="font-medium text-foreground underline underline-offset-4">Appointments</Link>.
          </>
        }
      />
      <PageBody>
        {gaps.length ? (
          <Panel title="Before clients can book" className="border-amber-200">
            <ul className="grid gap-2 text-sm">
              {gaps.map((gap) => (
                <li key={gap.href}>
                  <Link href={gap.href} className="font-medium text-brand underline-offset-4 hover:underline">{gap.text}</Link>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
        <RulesForm rules={bookingRulesFromRow(settings.data)} currency={business.currency} />
        <StaffHours staff={team} workingHours={workingHours} openingHours={openingHours} />
        <TimeOffPanel timeOff={(timeOff.data ?? []).map(timeOffFromRow)} staff={team} timeZone={safeTimeZone(business.timezone)} />
        <BookingForm business={business} />
      </PageBody>
    </>
  );
}
