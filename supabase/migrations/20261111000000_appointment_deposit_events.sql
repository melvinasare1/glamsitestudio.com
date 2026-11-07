-- appointments.refund_cents/refunded_at only ever hold the LAST refund, and
-- deposit_status flipping to 'refunded' blocks any further refund action --
-- so a deposit could never be refunded in two parts, and there was no record
-- of forfeits (when and why a deposit was kept) at all. This adds an
-- append-only history table so multiple partial refunds and forfeits are
-- each logged, and an appointment's deposit can be refunded in installments
-- up to what was paid.

create table public.appointment_deposit_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null check (kind in ('refunded', 'forfeited')),
  amount_cents integer not null default 0 check (amount_cents >= 0),
  created_at timestamptz not null default now()
);

create index appointment_deposit_events_appointment_id_idx
  on public.appointment_deposit_events (appointment_id, created_at);

alter table public.appointment_deposit_events enable row level security;

create policy appointment_deposit_events_owner_all on public.appointment_deposit_events
  for all to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

revoke all on public.appointment_deposit_events from anon, authenticated;
grant select, insert on public.appointment_deposit_events to authenticated;
grant all on public.appointment_deposit_events to service_role;
