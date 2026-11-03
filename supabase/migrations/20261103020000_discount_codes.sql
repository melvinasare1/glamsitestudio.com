-- Discount codes an owner creates and a client can enter at checkout.
-- Applied to the salon's own Stripe Connect charge (rule 9: this discounts
-- what the client pays the salon, never our own hosting revenue).

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Letters, numbers and hyphens only, so a code can always be matched with
  -- a plain case-insensitive compare (no SQL wildcard characters to escape).
  code text not null check (code ~ '^[A-Za-z0-9-]{1,40}$'),
  kind text not null default 'percent' check (kind in ('percent', 'fixed')),
  percent_off integer check (percent_off between 1 and 100),
  amount_off_cents integer check (amount_off_cents > 0),
  is_active boolean not null default true,
  -- null = unlimited.
  max_redemptions integer check (max_redemptions > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_codes_value_matches_kind check (
    (kind = 'percent' and percent_off is not null and amount_off_cents is null)
    or (kind = 'fixed' and amount_off_cents is not null and percent_off is null)
  )
);

create unique index discount_codes_business_code_key on public.discount_codes (business_id, upper(code));
create index discount_codes_business_id_idx on public.discount_codes (business_id);

create trigger discount_codes_set_updated_at
before update on public.discount_codes
for each row execute function public.set_updated_at();

alter table public.discount_codes enable row level security;

create policy discount_codes_owner_all on public.discount_codes
for all to authenticated
using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

grant select, insert, update, delete on public.discount_codes to authenticated;
-- The booking API reads/redeems codes with the service-role client (no
-- client session exists yet at checkout time), same as it does for clients
-- and appointments.
grant select, update on public.discount_codes to service_role;

-- What, if anything, was applied to an appointment's payment.
alter table public.appointments
  add column discount_code text,
  add column discount_cents integer not null default 0 check (discount_cents >= 0);
