-- Seller-editable storefront copy and image URLs (keyed by template field keys).
-- Empty object until the seller saves from dashboard settings.

alter table public.sellers
  add column if not exists store_content jsonb default '{}'::jsonb;

comment on column public.sellers.store_content is
  'Seller-editable storefront copy and image URLs, keyed by template field keys.';
