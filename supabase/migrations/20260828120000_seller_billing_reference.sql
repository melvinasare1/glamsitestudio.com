-- Permanent 6-digit billing reference per seller, used as the MoMo payment
-- reference for monthly fees. Sequence-backed so inserts cannot collide.
-- Caps at 999,999 sellers; widen the format before that limit is reached.

create sequence if not exists public.billing_reference_seq
  as integer
  start with 1
  increment by 1
  minvalue 1
  maxvalue 999999;

alter table public.sellers
  add column if not exists billing_reference text;

-- Backfill existing rows in created order so earlier sellers get lower codes.
do $$
declare
  r record;
begin
  for r in
    select id
    from public.sellers
    where billing_reference is null
    order by created_at, id
  loop
    update public.sellers
    set billing_reference = lpad(nextval('public.billing_reference_seq')::text, 6, '0')
    where id = r.id;
  end loop;
end $$;

alter table public.sellers
  alter column billing_reference set not null;

alter table public.sellers
  alter column billing_reference set default lpad(nextval('public.billing_reference_seq')::text, 6, '0');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sellers_billing_reference_key'
  ) then
    alter table public.sellers
      add constraint sellers_billing_reference_key unique (billing_reference);
  end if;
end $$;

create or replace function public.sellers_set_billing_reference()
returns trigger
language plpgsql
as $$
begin
  if new.billing_reference is null or btrim(new.billing_reference) = '' then
    new.billing_reference := lpad(nextval('public.billing_reference_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists sellers_set_billing_reference on public.sellers;
create trigger sellers_set_billing_reference
before insert on public.sellers
for each row
execute function public.sellers_set_billing_reference();

alter sequence public.billing_reference_seq owned by public.sellers.billing_reference;

grant usage, select on sequence public.billing_reference_seq to anon, authenticated, service_role;
