-- Owner tools for the day of: check clients in, mark them late, and a
-- client referral/earn program (reward is a one-time discount code, not a
-- booking credit -- rule 8, "appointments, not credits").

-- ---------------------------------------------------------------------------
-- Check-in and "late"
-- ---------------------------------------------------------------------------

-- Informational flag, independent of status: an owner can check a client in
-- without changing status, then later mark completed/no_show/late as normal.
alter table public.appointments
  add column checked_in_at timestamptz;

create index appointments_checked_in_idx
  on public.appointments (business_id)
  where checked_in_at is not null;

alter table public.appointments drop constraint appointments_status_check;
alter table public.appointments add constraint appointments_status_check check (
  status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'late')
);

-- ---------------------------------------------------------------------------
-- Client referral codes
-- ---------------------------------------------------------------------------

alter table public.clients
  add column referral_code text not null default substr(md5(random()::text), 1, 8);

create unique index clients_business_referral_code_key
  on public.clients (business_id, upper(referral_code));

-- ---------------------------------------------------------------------------
-- Referral program
-- ---------------------------------------------------------------------------

alter table public.businesses
  add column referral_reward_cents integer check (referral_reward_cents is null or referral_reward_cents >= 0);

alter table public.appointments
  add column referred_by_client_id uuid;
alter table public.appointments
  add constraint appointments_referred_by_fkey
  foreign key (referred_by_client_id, business_id) references public.clients (id, business_id) on delete set null;

-- One referral record per referred client: the first time someone they
-- referred books, we track it; the reward fires once, when that referred
-- client's first appointment is marked completed.
create table public.client_referrals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  referrer_client_id uuid not null,
  referred_client_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'rewarded')),
  reward_discount_code_id uuid references public.discount_codes (id) on delete set null,
  created_at timestamptz not null default now(),
  rewarded_at timestamptz,
  foreign key (referrer_client_id, business_id) references public.clients (id, business_id) on delete cascade,
  foreign key (referred_client_id, business_id) references public.clients (id, business_id) on delete cascade,
  check (referrer_client_id <> referred_client_id)
);

create unique index client_referrals_referred_client_key
  on public.client_referrals (business_id, referred_client_id);
create index client_referrals_referrer_id_idx
  on public.client_referrals (referrer_client_id, business_id);

alter table public.client_referrals enable row level security;

create policy client_referrals_owner_all on public.client_referrals
for all to authenticated
using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

grant select, insert, update, delete on public.client_referrals to authenticated;
-- The booking API links a referred client with the service-role client, same as it does for clients and appointments.
grant select, insert on public.client_referrals to service_role;
