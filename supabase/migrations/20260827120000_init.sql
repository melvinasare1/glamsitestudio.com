-- Glam Site Studios data model. One shared Postgres database; every tenant row is scoped
-- by seller_id (or sellers.id). RLS mirrors the old firestore.rules:
--   sellers     public read, owner write
--   products    public read, owner write
--   orders      public insert (checkout), owner read/update
--   daily_metrics  owner read, no client writes (service role only)
--   leads       public insert, no client reads (service role / admin only)
--
-- sellers.id is the tenant key. Once Supabase Auth is wired, create each
-- seller row with id = auth.uid() so policies that compare seller_id to
-- auth.uid() hold. Do not introduce Auth in this migration.

create extension if not exists "pgcrypto";

create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null unique,
  business_name text not null,
  domain text not null default '',
  store_slug text not null unique,
  template text not null check (template in ('template-a', 'template-b')),
  email text not null default '',
  phone text not null default '',
  pricing_tier text not null check (pricing_tier in ('early_bird', 'standard')),
  base_fee_cedis numeric(12, 2) not null default 250,
  status text not null check (status in ('onboarding', 'active', 'paused', 'offboarded')),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  name text not null,
  description text not null default '',
  price_cedis numeric(12, 2) not null,
  compare_at_price_cedis numeric(12, 2),
  images text[] not null default '{}',
  stock_quantity integer not null default 0,
  sku text not null default '',
  category text not null default '',
  active boolean not null default true,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index products_seller_id_idx on public.products (seller_id);
create index products_seller_active_idx on public.products (seller_id, active);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  subtotal_cedis numeric(12, 2) not null,
  buyer_name text not null default '',
  buyer_phone text not null default '',
  delivery_address text not null default '',
  status text not null check (
    status in (
      'pending_payment',
      'paid',
      'packed',
      'dispatched',
      'delivered',
      'return_requested',
      'returned',
      'cancelled'
    )
  ),
  payment_reference text,
  packaging_photo_url text,
  packaging_video_url text,
  rider_service text check (rider_service in ('yango', 'in_house')),
  created_at timestamptz not null default now(),
  packed_at timestamptz,
  dispatched_at timestamptz
);

create index orders_seller_id_idx on public.orders (seller_id);

create table public.daily_metrics (
  date date not null,
  seller_id uuid not null references public.sellers (id) on delete cascade,
  impressions integer not null default 0,
  store_visits integer not null default 0,
  orders_placed integer not null default 0,
  revenue_cedis numeric(12, 2) not null default 0,
  primary key (seller_id, date)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null default '',
  phone text not null,
  email text not null default '',
  product_category text not null default '',
  estimated_monthly_orders integer,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.sellers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.leads enable row level security;

-- sellers: storefront needs public brand info; only the owner can write.
create policy sellers_public_read
  on public.sellers for select
  using (true);

create policy sellers_owner_insert
  on public.sellers for insert
  with check (auth.uid() = id);

create policy sellers_owner_update
  on public.sellers for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy sellers_owner_delete
  on public.sellers for delete
  using (auth.uid() = id);

-- products: catalogs are public; writes are the owning seller.
create policy products_public_read
  on public.products for select
  using (true);

create policy products_owner_insert
  on public.products for insert
  with check (auth.uid() = seller_id);

create policy products_owner_update
  on public.products for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy products_owner_delete
  on public.products for delete
  using (auth.uid() = seller_id);

-- orders: buyers (unauthenticated) place orders; only the seller can read/update.
create policy orders_public_insert
  on public.orders for insert
  with check (true);

create policy orders_owner_select
  on public.orders for select
  using (auth.uid() = seller_id);

create policy orders_owner_update
  on public.orders for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy orders_owner_delete
  on public.orders for delete
  using (auth.uid() = seller_id);

-- daily_metrics: seller-readable; written only by the service role (no client policy).
create policy daily_metrics_owner_select
  on public.daily_metrics for select
  using (auth.uid() = seller_id);

-- leads: public signup form insert; reads only via service role (no select policy).
create policy leads_public_insert
  on public.leads for insert
  with check (true);

grant usage on schema public to anon, authenticated;

grant select on table public.sellers to anon, authenticated;
grant insert, update, delete on table public.sellers to authenticated;

grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

grant insert on table public.orders to anon, authenticated;
grant select, update, delete on table public.orders to authenticated;

grant select on table public.daily_metrics to authenticated;

grant insert on table public.leads to anon, authenticated;
