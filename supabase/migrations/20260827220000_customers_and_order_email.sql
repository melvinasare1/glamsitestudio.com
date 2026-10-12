-- Customers are unique per seller by email. Checkout (service role) creates or
-- updates a customer, then attaches the order. Buyers never write this table
-- from the browser. seller_id = auth.uid() matches products/orders once seller
-- rows are created with id = auth.uid().

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  email text not null,
  name text not null default '',
  phone text not null default '',
  delivery_address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_seller_id_email_key unique (seller_id, email)
);

create index customers_seller_id_idx on public.customers (seller_id);

alter table public.orders
  add column customer_id uuid references public.customers (id) on delete set null,
  add column buyer_email text not null default '';

create index orders_customer_id_idx on public.orders (customer_id);

alter table public.customers enable row level security;

create policy customers_owner_select
  on public.customers for select
  using (auth.uid() = seller_id);

create policy customers_owner_insert
  on public.customers for insert
  with check (auth.uid() = seller_id);

create policy customers_owner_update
  on public.customers for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy customers_owner_delete
  on public.customers for delete
  using (auth.uid() = seller_id);

grant select, insert, update, delete on table public.customers to authenticated;
