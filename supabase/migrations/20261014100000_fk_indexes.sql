-- Cover the composite (…, business_id) foreign keys flagged by the Supabase
-- performance advisor, so deletes and joins don't scan whole tables.

create index if not exists appointments_staff_business_idx on public.appointments (staff_id, business_id);
create index if not exists services_category_business_idx on public.services (category_id, business_id);
create index if not exists staff_services_staff_business_idx on public.staff_services (staff_id, business_id);
