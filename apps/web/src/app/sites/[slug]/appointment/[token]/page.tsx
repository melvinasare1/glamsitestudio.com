import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STATUS_LABELS, formatClock, formatDayLong, safeTimeZone, zonedParts } from "@glamsite/shared/booking";
import { sitePath } from "@glamsite/shared/domain";
import { formatAddress, formatMoney } from "@glamsite/shared/format";
import { BookingFrame } from "@/components/booking/BookingFrame";
import { CancelAppointment } from "@/components/booking/CancelAppointment";
import { getAppointmentByToken } from "@/lib/booking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Your appointment", robots: { index: false, follow: false } };

type Props = { params: { slug: string; token: string } };

/** The client's private link from their confirmation email: see the booking and cancel it. */
export default async function AppointmentPage({ params }: Props) {
  const managed = await getAppointmentByToken(params.token);
  if (!managed || managed.business.slug !== params.slug) notFound();
  const { appointment, business, rules, canCancel } = managed;

  const zone = safeTimeZone(business.timezone);
  const day = zonedParts(new Date(appointment.startsAt), zone).ymd;
  const cancelled = appointment.status === "cancelled";
  const past = new Date(appointment.endsAt).getTime() < Date.now();
  const address = formatAddress(business.address);

  const heading = cancelled
    ? "This appointment is cancelled"
    : appointment.status === "pending"
      ? "Waiting for the salon to confirm"
      : appointment.status === "confirmed"
        ? past
          ? "Your appointment"
          : "You're booked in"
        : STATUS_LABELS[appointment.status];

  return (
    <BookingFrame business={business} homeHref={sitePath(business.slug, "/")}>
      <section className="mx-auto max-w-xl py-4 md:py-10">
        <p className="text-sm text-[#6e6468]">Hi {appointment.client?.name.split(" ")[0] || "there"},</p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-4xl leading-tight md:text-5xl">{heading}</h1>

        <dl className="mt-8 divide-y divide-[#ece6e3] border-y border-[#ece6e3] text-[15px]">
          <Row label="When">
            {formatDayLong(day)}, {formatClock(appointment.startsAt, zone)} – {formatClock(appointment.endsAt, zone)}
          </Row>
          <Row label="Service">{appointment.serviceName}</Row>
          {appointment.staffName ? <Row label="With">{appointment.staffName}</Row> : null}
          {appointment.priceCents != null ? <Row label="Price">{formatMoney(appointment.priceCents, appointment.currency)}</Row> : null}
          {address ? <Row label="Where">{address}</Row> : null}
        </dl>

        <div className="mt-8">
          {cancelled ? (
            <a
              href={sitePath(business.slug, "/book")}
              className="inline-flex rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-medium text-[var(--brand-ink)] hover:opacity-90"
            >
              Book another time
            </a>
          ) : canCancel ? (
            <CancelAppointment token={params.token} />
          ) : !past ? (
            <p className="text-[#4a4145]">
              {`It's too late to cancel online (${rules.cancellationNoticeHours} hours' notice).`}{" "}
              {business.phone ? `Call ${business.phone} if your plans change.` : "Contact the salon if your plans change."}
            </p>
          ) : null}
        </div>

        {!cancelled && rules.policyText.trim() ? (
          <div className="mt-10 rounded-xl bg-[#f7f4f2] px-4 py-4 text-sm">
            <p className="font-medium">Booking policy</p>
            <p className="mt-1 whitespace-pre-line text-[#4a4145]">{rules.policyText.trim()}</p>
          </div>
        ) : null}
      </section>
    </BookingFrame>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-6 py-3">
      <dt className="w-20 shrink-0 text-[#6e6468]">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
