-- Owner-recorded refund bookkeeping. This does not call Stripe to issue a
-- refund (owners do that from their own Stripe/Connect dashboard) — it just
-- lets the owner note what went back to a client so the Finance page's
-- totals reflect reality. deposit_status already has 'refunded' and
-- 'forfeited' states (see baseline); this adds the amount and when.
alter table public.appointments
  add column refund_cents integer not null default 0 check (refund_cents >= 0),
  add column refunded_at timestamptz;

-- General, business-wide estimated tax rate shown on the Finance page.
-- Informational only: never applied to a Stripe charge, not jurisdiction
-- aware (rule: keep tax very general for now, see AGENTS.md).
alter table public.businesses
  add column tax_rate_percent numeric(5, 2)
    check (tax_rate_percent is null or (tax_rate_percent >= 0 and tax_rate_percent <= 100));
