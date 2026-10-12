-- Separate contact mobile from MoMo payment number. Existing rows used phone for checkout MoMo.
alter table public.sellers
  add column if not exists momo_phone text not null default '';

update public.sellers
set momo_phone = phone
where momo_phone = '';
