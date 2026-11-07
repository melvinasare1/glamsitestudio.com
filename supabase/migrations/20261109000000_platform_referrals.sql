-- "Earn": business-to-business referrals. A business owner refers another
-- salon/barber/etc to Glam Site Studios and earns a flat 15% lifetime
-- commission on what that business pays us for hosting (not on anything a
-- client pays the referred salon -- this is our revenue being shared, not
-- rule 9's Connect money). Fully staff-run, like Ternarie's Earn feature:
-- owners submit a referral and watch its status, but only platform staff
-- (via the admin, service-role client) advance status and record monthly
-- earnings. Deliberately separate from the unrelated client-to-client
-- `client_referrals` program added in 20261104020000_checkin_late_referrals.sql.

create table public.platform_referrals (
  id uuid primary key default gen_random_uuid(),
  -- The business that gets the commission.
  referrer_business_id uuid not null references public.businesses (id) on delete cascade,
  referred_business_name text not null,
  referred_contact_name text not null,
  referred_contact_email text not null,
  referred_contact_phone text not null default '',
  status text not null default 'submitted' check (
    status in ('submitted', 'contacted', 'signed_up', 'active', 'lost')
  ),
  -- Linked once the referred business actually signs up, so earnings can
  -- read their real hosting spend instead of a manually-entered figure.
  referred_business_id uuid references public.businesses (id) on delete set null,
  -- Staff-only context (why it's "lost", who's chasing it, etc). Never shown to the referrer.
  staff_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (referrer_business_id <> referred_business_id)
);

create index platform_referrals_referrer_id_idx on public.platform_referrals (referrer_business_id);
create index platform_referrals_referred_business_id_idx on public.platform_referrals (referred_business_id) where referred_business_id is not null;

create trigger platform_referrals_set_updated_at
before update on public.platform_referrals
for each row execute function public.set_updated_at();

alter table public.platform_referrals enable row level security;

-- Owners can submit a referral and see their own, but only staff (service
-- role, via the admin app) move it through its pipeline -- no update/delete
-- for authenticated.
create policy platform_referrals_owner_select on public.platform_referrals
for select to authenticated
using (referrer_business_id in (select id from public.businesses where owner_id = (select auth.uid())));

create policy platform_referrals_owner_insert on public.platform_referrals
for insert to authenticated
with check (referrer_business_id in (select id from public.businesses where owner_id = (select auth.uid())));

grant select, insert on public.platform_referrals to authenticated;
grant select, insert, update, delete on public.platform_referrals to service_role;

-- ---------------------------------------------------------------------------
-- Earnings: one row per referral per calendar month it earned commission.
-- Staff record these by hand once a month (no Stripe automation, same as
-- Ternarie), reading the referred business's real hosting spend.
-- ---------------------------------------------------------------------------

create table public.platform_referral_earnings (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.platform_referrals (id) on delete cascade,
  -- Denormalized so RLS and the owner-facing earnings query don't need a join.
  referrer_business_id uuid not null references public.businesses (id) on delete cascade,
  year_month text not null check (year_month ~ '^\d{4}-\d{2}$'),
  -- What the referred business paid us for hosting that month, in cents.
  gross_cents integer not null check (gross_cents >= 0),
  commission_cents integer generated always as (round(gross_cents * 0.15)) stored,
  created_at timestamptz not null default now()
);

create unique index platform_referral_earnings_referral_month_key
  on public.platform_referral_earnings (referral_id, year_month);
create index platform_referral_earnings_referrer_id_idx
  on public.platform_referral_earnings (referrer_business_id);

alter table public.platform_referral_earnings enable row level security;

-- Owners can only ever read their own earnings; recording them is staff-only.
create policy platform_referral_earnings_owner_select on public.platform_referral_earnings
for select to authenticated
using (referrer_business_id in (select id from public.businesses where owner_id = (select auth.uid())));

grant select on public.platform_referral_earnings to authenticated;
grant select, insert, update, delete on public.platform_referral_earnings to service_role;

-- ---------------------------------------------------------------------------
-- Payout details: where staff send a referrer's commission. Owner-managed,
-- staff-read -- there's no Stripe Connect payout for this (it's platform
-- revenue share, not a salon's own booking payment), so this is deliberately
-- plain bank details rather than a Stripe account id.
-- ---------------------------------------------------------------------------

create table public.platform_referral_payout_details (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  account_name text not null default '',
  account_number text not null default '',
  sort_code text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create trigger platform_referral_payout_details_set_updated_at
before update on public.platform_referral_payout_details
for each row execute function public.set_updated_at();

alter table public.platform_referral_payout_details enable row level security;

create policy platform_referral_payout_details_owner_all on public.platform_referral_payout_details
for all to authenticated
using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

grant select, insert, update, delete on public.platform_referral_payout_details to authenticated;
grant select on public.platform_referral_payout_details to service_role;
