-- Storefront contact form enquiries. Public visitors can insert; only the
-- owning seller can read their own rows. There is no dashboard UI yet.

create table public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  message text not null default '',
  created_at timestamptz not null default now()
);

create index contact_enquiries_seller_id_idx on public.contact_enquiries (seller_id);
create index contact_enquiries_created_at_idx on public.contact_enquiries (seller_id, created_at desc);

alter table public.contact_enquiries enable row level security;

create policy contact_enquiries_public_insert
  on public.contact_enquiries for insert
  with check (true);

create policy contact_enquiries_owner_select
  on public.contact_enquiries for select
  using (auth.uid() = seller_id);

grant insert on table public.contact_enquiries to anon, authenticated;
grant select on table public.contact_enquiries to authenticated;
