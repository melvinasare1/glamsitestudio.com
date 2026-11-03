import { platformFeeCents } from "@glamsite/shared/billing";
import type { Appointment } from "@glamsite/shared/types";

/**
 * Finance numbers for the owner's appointments, for one date range. Scoped
 * to appointments only — no product sales/shipping yet (see AGENTS.md: ship
 * what the next stage needs; e-commerce templates are a later session).
 *
 * `platformFeeCents` is applied at the *current* rate, not the rate that was
 * actually in effect when each appointment was booked — the rate isn't
 * stored per-appointment, so this is an approximation for past bookings if
 * PLATFORM_FEE_BPS has ever changed. Good enough for an owner's rough sense
 * of take-home; call this out in the UI rather than pretending it's exact.
 */
export type FinanceSummary = {
  /** Appointments counted (anything not cancelled). */
  count: number;
  /** Sum of priceCents after discounts, across counted appointments. */
  revenueCents: number;
  discountCents: number;
  refundCents: number;
  /** Sum of depositCents actually collected online (deposit_status = 'paid'). */
  collectedCents: number;
  /** Our cut of what was collected online, at today's PLATFORM_FEE_BPS. */
  platformFeeCents: number;
  /** collectedCents - platformFeeCents - refundCents: a rough "money that reached you" figure. */
  netCents: number;
  /** revenueCents x the business's general tax rate. Informational only. */
  estimatedTaxCents: number;
  currency: string;
};

export type TopCustomer = { clientId: string; name: string; email: string; spendCents: number; visits: number };

const NOT_CANCELLED = (appointment: Appointment) => appointment.status !== "cancelled";

export function summarizeFinance(appointments: Appointment[], taxRatePercent: number | null): FinanceSummary {
  const counted = appointments.filter(NOT_CANCELLED);
  const currency = counted[0]?.currency ?? "GBP";

  let revenueCents = 0;
  let discountCents = 0;
  let refundCents = 0;
  let collectedCents = 0;
  let platformFeeTotal = 0;

  for (const appointment of counted) {
    revenueCents += Math.max(0, (appointment.priceCents ?? 0) - appointment.discountCents);
    discountCents += appointment.discountCents;
    refundCents += appointment.refundCents;
    if (appointment.depositStatus === "paid" || appointment.depositStatus === "refunded") {
      collectedCents += appointment.depositCents;
      platformFeeTotal += platformFeeCents(appointment.depositCents);
    }
  }

  const estimatedTaxCents = taxRatePercent == null ? 0 : Math.round(revenueCents * (taxRatePercent / 100));

  return {
    count: counted.length,
    revenueCents,
    discountCents,
    refundCents,
    collectedCents,
    platformFeeCents: platformFeeTotal,
    netCents: collectedCents - platformFeeTotal - refundCents,
    estimatedTaxCents,
    currency,
  };
}

/** Clients who've spent the most, by booking value after discounts. Appointments with no client (shouldn't happen) are skipped. */
export function topCustomers(appointments: Appointment[], limit = 10): TopCustomer[] {
  const byClient = new Map<string, TopCustomer>();
  for (const appointment of appointments.filter(NOT_CANCELLED)) {
    if (!appointment.clientId || !appointment.client) continue;
    const spend = Math.max(0, (appointment.priceCents ?? 0) - appointment.discountCents);
    const existing = byClient.get(appointment.clientId);
    if (existing) {
      existing.spendCents += spend;
      existing.visits += 1;
    } else {
      byClient.set(appointment.clientId, {
        clientId: appointment.clientId,
        name: appointment.client.name,
        email: appointment.client.email,
        spendCents: spend,
        visits: 1,
      });
    }
  }
  return [...byClient.values()].sort((a, b) => b.spendCents - a.spendCents).slice(0, limit);
}
