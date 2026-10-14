-- One-off, 14 Oct 2026: remove the Ansaa product-shop schema from the two
-- Glam Site Studios projects before applying 20261014090000_baseline.sql.
-- Both databases were empty when this ran. Not needed on a fresh project.

drop table if exists
  public.billing_payments,
  public.contact_enquiries,
  public.product_filter_options,
  public.product_reviews,
  public.store_blog_posts,
  public.storefront_events,
  public.customers,
  public.product_categories,
  public.leads,
  public.daily_metrics,
  public.orders,
  public.products,
  public.sellers
cascade;

drop function if exists public.sellers_protect_billing_columns();
drop function if exists public.sellers_set_billing_reference();
drop sequence if exists public.billing_reference_seq;

drop type if exists
  public.seller_template,
  public.seller_pricing_tier,
  public.seller_status,
  public.seller_domain_type,
  public.seller_subscription_status;

drop policy if exists product_images_public_read on storage.objects;
drop policy if exists product_images_seller_insert on storage.objects;
drop policy if exists product_images_seller_update on storage.objects;
drop policy if exists product_images_seller_delete on storage.objects;
drop policy if exists id_verification_seller_insert on storage.objects;
drop policy if exists id_verification_seller_select on storage.objects;

-- The empty product-images and id-verification buckets can be deleted in
-- Storage in the dashboard (Supabase blocks deleting buckets from SQL).
