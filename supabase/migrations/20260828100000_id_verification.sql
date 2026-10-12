-- Private ID-verification bucket. Objects live at {seller_id}/{filename}.
-- The bucket is created in the Supabase dashboard (public access off). This
-- migration keeps it private, adds owner-only INSERT/SELECT policies, and
-- stores the resulting object paths on the seller row.
--
-- Admin review later uses the service role key server-side (bypasses RLS);
-- no admin storage policy is added here.
--
-- Apply with the rest of supabase/migrations (SQL editor or `supabase db push`).

insert into storage.buckets (id, name, public)
values ('id-verification', 'id-verification', false)
on conflict (id) do update
set public = false;

drop policy if exists id_verification_seller_insert on storage.objects;
drop policy if exists id_verification_seller_select on storage.objects;

-- Authenticated sellers may upload only under their own seller id folder.
create policy id_verification_seller_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'id-verification'
  and (storage.foldername(name))[1] = (
    select s.id::text
    from public.sellers s
    where s.id = (select auth.uid())
       or s.uid = (select auth.uid())
    limit 1
  )
);

-- Authenticated sellers may read only files under their own seller id folder.
-- Anon / public roles have no policy, so they cannot list or download objects.
create policy id_verification_seller_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'id-verification'
  and (storage.foldername(name))[1] = (
    select s.id::text
    from public.sellers s
    where s.id = (select auth.uid())
       or s.uid = (select auth.uid())
    limit 1
  )
);

alter table public.sellers
  add column if not exists id_document_url text,
  add column if not exists profile_photo_url text,
  add column if not exists business_registration_url text,
  add column if not exists has_business_registration boolean not null default false;
