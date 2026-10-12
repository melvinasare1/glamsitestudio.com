-- Allow sellers to mark an order refunded in-app. This is a status flag only;
-- MoMo money movement stays outside the system.

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'orders'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%status%pending_payment%';

  if constraint_name is not null then
    execute format('alter table public.orders drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.orders
  add constraint orders_status_check
  check (
    status in (
      'pending_payment',
      'paid',
      'packed',
      'dispatched',
      'delivered',
      'return_requested',
      'returned',
      'cancelled',
      'refunded'
    )
  );
