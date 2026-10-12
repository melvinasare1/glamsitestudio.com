-- Ride listing filters: product attributes plus seller-editable option lists.

alter table public.products
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists engine_size text not null default '',
  add column if not exists condition text,
  add column if not exists year integer;

alter table public.products
  drop constraint if exists products_condition_check;

alter table public.products
  add constraint products_condition_check
  check (condition is null or condition in ('new', 'used'));

create table if not exists public.product_filter_options (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  kind text not null check (kind in ('tag', 'engine_size', 'colour', 'year')),
  name text not null,
  created_at timestamptz not null default now(),
  constraint product_filter_options_seller_kind_name_key unique (seller_id, kind, name)
);

create index if not exists product_filter_options_seller_kind_idx
  on public.product_filter_options (seller_id, kind);

alter table public.product_filter_options enable row level security;

drop policy if exists product_filter_options_public_read on public.product_filter_options;
drop policy if exists product_filter_options_owner_insert on public.product_filter_options;
drop policy if exists product_filter_options_owner_update on public.product_filter_options;
drop policy if exists product_filter_options_owner_delete on public.product_filter_options;

create policy product_filter_options_public_read
  on public.product_filter_options for select
  using (true);

create policy product_filter_options_owner_insert
  on public.product_filter_options for insert
  with check (auth.uid() = seller_id);

create policy product_filter_options_owner_update
  on public.product_filter_options for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy product_filter_options_owner_delete
  on public.product_filter_options for delete
  using (auth.uid() = seller_id);

grant select on table public.product_filter_options to anon, authenticated;
grant insert, update, delete on table public.product_filter_options to authenticated;
