-- Seller blog posts. Used by templates that show a Recent Blog Posts section
-- (currently motorbike-template / Ride). Dashboard CRUD is owner-only;
-- the public storefront reads published rows.

create table public.store_blog_posts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  image_url text not null default '',
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index store_blog_posts_seller_published_idx
  on public.store_blog_posts (seller_id, published, published_at desc);

alter table public.store_blog_posts enable row level security;

create policy store_blog_posts_public_read
  on public.store_blog_posts for select
  using (published = true);

create policy store_blog_posts_owner_select
  on public.store_blog_posts for select
  using (auth.uid() = seller_id);

create policy store_blog_posts_owner_insert
  on public.store_blog_posts for insert
  with check (auth.uid() = seller_id);

create policy store_blog_posts_owner_update
  on public.store_blog_posts for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy store_blog_posts_owner_delete
  on public.store_blog_posts for delete
  using (auth.uid() = seller_id);

grant select on table public.store_blog_posts to anon, authenticated;
grant insert, update, delete on table public.store_blog_posts to authenticated;
