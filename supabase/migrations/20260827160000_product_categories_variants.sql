-- Categories as first-class seller records, plus per-product variant rows
-- and a short description. sizes[] / colors[] stay on products so the
-- storefront selectors keep working without a template change.

alter table public.products
  add column if not exists short_description text not null default '',
  add column if not exists variants jsonb not null default '[]'::jsonb;

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint product_categories_seller_name_key unique (seller_id, name)
);

create index if not exists product_categories_seller_id_idx
  on public.product_categories (seller_id);

alter table public.product_categories enable row level security;

drop policy if exists product_categories_public_read on public.product_categories;
drop policy if exists product_categories_owner_insert on public.product_categories;
drop policy if exists product_categories_owner_update on public.product_categories;
drop policy if exists product_categories_owner_delete on public.product_categories;

create policy product_categories_public_read
  on public.product_categories for select
  using (true);

create policy product_categories_owner_insert
  on public.product_categories for insert
  with check (auth.uid() = seller_id);

create policy product_categories_owner_update
  on public.product_categories for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy product_categories_owner_delete
  on public.product_categories for delete
  using (auth.uid() = seller_id);

grant select on table public.product_categories to anon, authenticated;
grant insert, update, delete on table public.product_categories to authenticated;

-- Copy category names already used on products so the new table is not empty.
insert into public.product_categories (seller_id, name)
select distinct seller_id, category
from public.products
where length(trim(category)) > 0
on conflict (seller_id, name) do nothing;
