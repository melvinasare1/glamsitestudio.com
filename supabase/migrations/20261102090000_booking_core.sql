-- Online booking, phase 1: book, view and cancel appointments.
--
-- Which times can be booked is worked out in TypeScript
-- (packages/shared/src/booking.ts) by both the booking API and the dashboard.
-- The database stays the final guard: appointments_no_double_booking rejects
-- two live appointments for the same person at once, even if two clients
-- press Book at the same moment.

-- Who cancelled, so refunds and deposit rules can treat them differently.
alter table public.appointments
  add column cancelled_by text check (cancelled_by is null or cancelled_by in ('client', 'business'));

-- One client record per email per business. Booking twice with the same email
-- (in any letter case) reuses the record and fills in a missing phone number;
-- the name the owner has on file is kept. Clients without an email always get
-- a new record. Security invoker: owners can only call it for their own
-- business (RLS), and the public booking API calls it as the service role.
create function public.upsert_booking_client(
  p_business_id uuid,
  p_name text,
  p_email text,
  p_phone text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_phone text := btrim(coalesce(p_phone, ''));
  v_name text := btrim(coalesce(p_name, ''));
begin
  if v_email = '' then
    insert into public.clients (business_id, name, email, phone)
    values (p_business_id, v_name, '', v_phone)
    returning id into v_id;
    return v_id;
  end if;

  insert into public.clients (business_id, name, email, phone)
  values (p_business_id, v_name, v_email, v_phone)
  on conflict (business_id, lower(email)) where email <> ''
  do update set phone = case when public.clients.phone = '' then excluded.phone else public.clients.phone end
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.upsert_booking_client(uuid, text, text, text) from public, anon;
grant execute on function public.upsert_booking_client(uuid, text, text, text) to authenticated, service_role;
