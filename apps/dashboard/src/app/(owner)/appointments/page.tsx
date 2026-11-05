import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { addDays, isYmd, safeTimeZone, startOfWeek, todayIn, zonedTimeToInstant } from "@glamsite/shared/booking";
import { appointmentFromRow, serviceFromRow, staffFromRow } from "@glamsite/shared/mappers";
import { createClient } from "@glamsite/shared/supabase/server";
import { PageBody, PageHeader, Panel } from "@/components/page";
import { requireBusiness } from "@/lib/business";
import { AppointmentsBoard } from "./appointments-board";

export const dynamic = "force-dynamic";

type Props = { searchParams: { week?: string; staff?: string; new?: string } };

export default async function AppointmentsPage({ searchParams }: Props) {
  const { business } = await requireBusiness();
  const supabase = await createClient();
  const timeZone = safeTimeZone(business.timezone);
  const today = todayIn(timeZone);
  const week = startOfWeek(searchParams.week && isYmd(searchParams.week) ? searchParams.week : today);
  const weekStart = zonedTimeToInstant(week, 0, timeZone).toISOString();
  const weekEnd = zonedTimeToInstant(addDays(week, 7), 0, timeZone).toISOString();

  const [appointments, pending, staff, services] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, clients!appointments_client_id_business_id_fkey(name, email, phone), staff(name)")
      .eq("business_id", business.id)
      .gte("starts_at", weekStart)
      .lt("starts_at", weekEnd)
      .order("starts_at"),
    supabase
      .from("appointments")
      .select("*, clients!appointments_client_id_business_id_fkey(name, email, phone), staff(name)")
      .eq("business_id", business.id)
      .eq("status", "pending")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(50),
    supabase.from("staff").select("*, staff_services(service_id)").eq("business_id", business.id).order("position"),
    supabase.from("services").select("*").eq("business_id", business.id).order("position"),
  ]);
  for (const result of [appointments, pending, staff, services]) {
    if (result.error) console.error("[appointments] load failed", result.error.message);
  }

  const team = (staff.data ?? []).map(staffFromRow);
  const staffFilter = team.some((person) => person.id === searchParams.staff) ? searchParams.staff! : "all";

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Everything booked online or added by you, a week at a time."
        actions={
          <Link
            href={{ query: { ...searchParams, new: "1" } }}
            scroll={false}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <PlusIcon className="size-4" /> New appointment
          </Link>
        }
      />
      <PageBody className="max-w-6xl">
        {business.bookingMode !== "glamsite" ? (
          <Panel>
            <p className="text-sm">
              <span className="font-medium">Online booking is off.</span>{" "}
              <span className="text-muted-foreground">You can still add appointments here yourself. To let clients book on your site, </span>
              <Link href="/booking" className="font-medium text-brand underline-offset-4 hover:underline">
                turn on Glam Site booking
              </Link>
              .
            </p>
          </Panel>
        ) : null}
        <AppointmentsBoard
          timeZone={timeZone}
          today={today}
          week={week}
          staffFilter={staffFilter}
          appointments={(appointments.data ?? []).map(appointmentFromRow)}
          pending={(pending.data ?? []).map(appointmentFromRow)}
          staff={team}
          services={(services.data ?? []).map(serviceFromRow)}
          openNew={searchParams.new === "1"}
        />
      </PageBody>
    </>
  );
}
