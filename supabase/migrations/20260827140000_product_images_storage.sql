-- Public product-image bucket. Objects live at {seller_id}/{filename}
-- so storefronts can read them and sellers can only write inside their folder.
--
-- Apply with the rest of supabase/migrations (SQL editor or `supabase db push`).
-- If INSERT into storage.buckets is blocked in your project, create the bucket
-- in the dashboard first (Storage → New bucket → name `product-images` → Public),
-- then run the policy statements below.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists product_images_public_read on storage.objects;
drop policy if exists product_images_seller_insert on storage.objects;
drop policy if exists product_images_seller_update on storage.objects;
drop policy if exists product_images_seller_delete on storage.objects;

-- Public read so storefront <img> tags and getPublicUrl work for anyone.
create policy product_images_public_read
on storage.objects
for select
using (bucket_id = 'product-images');

-- Authenticated sellers may upload only under their own seller id folder.
create policy product_images_seller_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (
    select s.id::text
    from public.sellers s
    where s.id = (select auth.uid())
       or s.uid = (select auth.uid())
    limit 1
  )
);

-- Allow replacing an object in the seller's own folder (upsert / retry).
create policy product_images_seller_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (
    select s.id::text
    from public.sellers s
    where s.id = (select auth.uid())
       or s.uid = (select auth.uid())
    limit 1
  )
)
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (
    select s.id::text
    from public.sellers s
    where s.id = (select auth.uid())
       or s.uid = (select auth.uid())
    limit 1
  )
);

create policy product_images_seller_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (
    select s.id::text
    from public.sellers s
    where s.id = (select auth.uid())
       or s.uid = (select auth.uid())
    limit 1
  )
);
