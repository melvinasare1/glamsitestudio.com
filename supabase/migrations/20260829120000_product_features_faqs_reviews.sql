-- Product feature ticks (per product), store-wide FAQs (per seller), and
-- buyer reviews tied to a real order. Reviews are publicly readable; inserts
-- happen only via the service-role /api/reviews route.

alter table public.products
  add column if not exists features jsonb default '[]'::jsonb;

alter table public.sellers
  add column if not exists faqs jsonb default '[]'::jsonb;

comment on column public.products.features is
  'Short strings shown as a tick-list on the product page.';

comment on column public.sellers.faqs is
  'Store-wide FAQ pairs { question, answer }, reused on every product page.';

alter table public.products
  drop constraint if exists products_features_is_array;
alter table public.products
  add constraint products_features_is_array
  check (features is null or jsonb_typeof(features) = 'array');

alter table public.sellers
  drop constraint if exists sellers_faqs_is_array;
alter table public.sellers
  add constraint sellers_faqs_is_array
  check (faqs is null or jsonb_typeof(faqs) = 'array');

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  seller_id uuid not null references public.sellers (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  reviewer_name text not null default '',
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

create index product_reviews_product_id_idx on public.product_reviews (product_id);
create index product_reviews_seller_id_idx on public.product_reviews (seller_id);

alter table public.product_reviews enable row level security;

create policy product_reviews_public_read
  on public.product_reviews for select
  using (true);

grant select on table public.product_reviews to anon, authenticated;
