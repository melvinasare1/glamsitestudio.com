-- Hosting tiers (Basic/Popular/Premium), a one-off design-service choice
-- (DIY/done-for-you), template price categories, and an owner-configurable,
-- quota-metered transactional email system.
--
-- Stripe billing is not wired up yet (see business_billing comment below);
-- these are recorded choices only, same as `plan` was before this migration.

-- ---------------------------------------------------------------------------
-- Templates: price by category, not by individual template
-- ---------------------------------------------------------------------------

alter table public.templates
  add column price_tier text check (price_tier in ('single_page', 'regular', 'luxe'));

update public.templates set price_cents = 0 where id in ('luxe', 'salon', 'barber');

-- ---------------------------------------------------------------------------
-- Billing: split the one-off design service from the recurring hosting tier
-- ---------------------------------------------------------------------------

alter table public.business_billing
  add column design_service text not null default 'diy' check (design_service in ('diy', 'done_for_you'));

update public.business_billing set design_service = plan;

alter table public.business_billing
  add column hosting_tier text not null default 'basic' check (hosting_tier in ('basic', 'popular', 'premium'));

-- ---------------------------------------------------------------------------
-- Email quota: one row per business per calendar month, resets for free
-- ---------------------------------------------------------------------------

create table public.email_usage (
  business_id uuid not null references public.businesses (id) on delete cascade,
  year_month text not null check (year_month ~ '^\d{4}-\d{2}$'),
  sent_count integer not null default 0 check (sent_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (business_id, year_month)
);

create function public.increment_email_usage(p_business_id uuid, p_year_month text, p_count integer default 1)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.email_usage (business_id, year_month, sent_count)
  values (p_business_id, p_year_month, p_count)
  on conflict (business_id, year_month)
  do update set sent_count = public.email_usage.sent_count + excluded.sent_count, updated_at = now()
  returning sent_count;
$$;

revoke execute on function public.increment_email_usage(uuid, text, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Which transactional emails an owner wants sent (gated by hosting tier in
-- app code, same split as booking_settings validation living in app code)
-- ---------------------------------------------------------------------------

create table public.email_notification_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  client_booking_confirmation_enabled boolean not null default true,
  owner_booking_confirmation_enabled boolean not null default true,
  client_cancellation_enabled boolean not null default true,
  owner_cancellation_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger email_notification_settings_set_updated_at
before update on public.email_notification_settings
for each row execute function public.set_updated_at();

insert into public.email_notification_settings (business_id)
select id from public.businesses
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.email_usage enable row level security;
alter table public.email_notification_settings enable row level security;

create policy email_usage_owner_read on public.email_usage
  for select to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

-- Tier-gating (Basic can't customize) is enforced in the server action, not
-- here, the same split booking_settings uses for its range checks.
create policy email_notification_settings_owner_all on public.email_notification_settings
  for all to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

grant select on public.email_usage to authenticated;
grant select, insert, update on public.email_notification_settings to authenticated;
