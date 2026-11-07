import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STATUS_LABELS, formatClock, formatDayLong, safeTimeZone, zonedParts } from "@glamsite/shared/booking";
import { sitePath } from "@glamsite/shared/domain";
import { formatAddress, formatMoney } from "@glamsite/shared/format";
import { getStripe } from "@glamsite/shared/stripe";
import { BookingFrame } from "@/components/booking/BookingFrame";
import { CancelAppointment } from "@/components/booking/CancelAppointment";
import { PaymentProcessingPoll } from "@/components/booking/PaymentProcessingPoll";
import { ReferAFriend } from "@/components/booking/ReferAFriend";
import { confirmBookingPayment, getAppointmentByToken, getReferralLink } from "@/lib/booking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Your appointment", robots: { index: false, follow: false } };

type Props = { params: { slug: string; token: string }; searchParams: { session_id?: string } };

/**
 * The client's private link from their confirmation email, and also
 * Checkout's success_url for a paid booking (with ?session_id=...). The
 * webhook is the source of truth, but it can land after this page's first
 * render, so when we're the one holding a session_id we confirm the
 * payment straight from Stripe ourselves first -- confirmBookingPayment is
 * idempotent, so there's no harm if the webhook already got there.
 */
export default async function AppointmentPage({ params, searchParams }: Props) {
  let managed = await getAppointmentByToken(params.token);
  if (!managed || managed.business.slug !== params.slug) notFound();

  if (searchParams.session_id && managed.appointment.depositStatus === "pending") {
    try {
      const session = await getStripe().checkout.sessions.retrieve(searchParams.session_id);
      if (session.metadata?.appointmentId === managed.appointment.id && session.payment_status === "paid") {
        await confirmBookingPayment(session);
        const refreshed = await getAppointmentByToken(params.token);
        if (refreshed) managed = refreshed;
      }
      // Else: a delayed payment method (e.g. a bank debit) -- Checkout
      // succeeded but the charge hasn't cleared yet. The "pending" state
      // below handles it: poll until the webhook (or a later visit here)
      // catches it up.
    } catch (error) {
      console.error("[appointment] confirm payment from session failed", error);
    }
  }

  const { appointment, business, rules, canCancel } = managed;

  const zone = safeTimeZone(business.timezone);
  const day = zonedParts(new Date(appointment.startsAt), zone).ymd;
  const cancelled = appointment.status === "cancelled";
  // True right after a successful Checkout redirect until the payment is
  // actually reconciled (by the block above, or the webhook) -- never true
  // otherwise, since nothing links here with a pending deposit unless a
  // payment was just attempted.
  const paymentPending = !cancelled && appointment.depositStatus === "pending";
  const past = new Date(appointment.endsAt).getTime() < Date.now();
  const address = formatAddress(business.address);
  const referralLink = cancelled ? null : await getReferralLink(business, appointment.clientId);

  const heading = paymentPending
    ? "Confirming your payment…"
    : cancelled
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
          {paymentPending ? (
            <PaymentProcessingPoll />
          ) : cancelled ? (
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

        {referralLink ? (
          <ReferAFriend
            link={referralLink}
            rewardText={`you'll get ${formatMoney(business.referralRewardCents as number, business.currency)} off your next visit`}
          />
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
