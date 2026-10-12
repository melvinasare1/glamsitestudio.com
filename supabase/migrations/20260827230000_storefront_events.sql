-- First-party storefront analytics. Visitors are anonymous, so inserts are
-- public; reads are the owning seller only (seller_id = auth.uid() once seller
-- rows are created with id = auth.uid()). Dashboard aggregates from this table.
-- Writes from /api/track use the service role and bypass RLS.

create table public.storefront_events (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  event_type text not null check (event_type in ('page_view', 'product_view', 'add_to_cart')),
  path text not null default '',
  product_id uuid references public.products (id) on delete set null,
  session_id text not null default '',
  created_at timestamptz not null default now()
);

create index storefront_events_seller_created_idx
  on public.storefront_events (seller_id, created_at);

create index storefront_events_seller_type_idx
  on public.storefront_events (seller_id, event_type);

alter table public.storefront_events enable row level security;

create policy storefront_events_public_insert
  on public.storefront_events for insert
  with check (true);

create policy storefront_events_owner_select
  on public.storefront_events for select
  using (auth.uid() = seller_id);

grant insert on table public.storefront_events to anon, authenticated;
grant select on table public.storefront_events to authenticated;
