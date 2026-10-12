-- Allow the motorbike storefront template on sellers.template.

do $$
declare
  conname text;
begin
  select con.conname into conname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'sellers'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%template%';

  if conname is not null then
    execute format('alter table public.sellers drop constraint %I', conname);
  end if;
end $$;

alter table public.sellers
  add constraint sellers_template_check
  check (template in (
    'template-a',
    'template-b',
    'template-c',
    'template-d',
    'template-e',
    'motorbike-template'
  ));
