-- Billing subscription status, separate from sellers.status (storefront ops).
-- Admin confirms MoMo payments; trial expiry alone must not look like "paid".

create type public.seller_subscription_status as enum (
  'trialing',
  'active',
  'overdue'
);

alter table public.sellers
  add column if not exists subscription_status public.seller_subscription_status;

alter table public.sellers
  add column if not exists last_payment_confirmed_at timestamptz;

-- Backfill: future trial → trialing; past or unset trial → overdue (needs manual check).
update public.sellers
set subscription_status = case
  when trial_ends_at is not null and trial_ends_at > now() then 'trialing'::public.seller_subscription_status
  else 'overdue'::public.seller_subscription_status
end
where subscription_status is null;

alter table public.sellers
  alter column subscription_status set default 'trialing'::public.seller_subscription_status;

alter table public.sellers
  alter column subscription_status set not null;

-- Sellers can update their own row; block client writes to billing columns.
create or replace function public.sellers_protect_billing_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.subscription_status is distinct from old.subscription_status
     or new.last_payment_confirmed_at is distinct from old.last_payment_confirmed_at then
    raise exception
      'subscription_status and last_payment_confirmed_at can only be changed by the service role';
  end if;
  return new;
end;
$$;

drop trigger if exists sellers_protect_billing_columns on public.sellers;
create trigger sellers_protect_billing_columns
before update on public.sellers
for each row
execute function public.sellers_protect_billing_columns();

-- Payment audit trail. No seller/public policies — access only via service role
-- (admin UI gated by ADMIN_EMAILS in the dashboard app).
create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  amount_cedis numeric(12, 2) not null check (amount_cedis >= 0),
  confirmed_by text not null,
  confirmed_at timestamptz not null default now(),
  period_label text not null
);

create index if not exists billing_payments_seller_id_idx
  on public.billing_payments (seller_id);

create index if not exists billing_payments_confirmed_at_idx
  on public.billing_payments (confirmed_at desc);

alter table public.billing_payments enable row level security;

-- Intentionally no policies for anon/authenticated: deny by default.
-- service_role bypasses RLS for admin mark-as-paid.
