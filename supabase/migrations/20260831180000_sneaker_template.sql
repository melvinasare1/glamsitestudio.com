-- Replace template-b with sneaker-template on sellers.template.
-- seller_template is a Postgres enum; values cannot be renamed in place, so
-- rebuild the type. Audited 2026-08-31: zero seller rows used template-b.
-- Any leftover template-b row is remapped rather than failing the cast.

do $$
declare
  unexpected text;
begin
  select string_agg(distinct template::text, ', ' order by template::text)
    into unexpected
  from public.sellers
  where template::text not in (
    'template-a',
    'template-b',
    'sneaker-template',
    'kitchenware-template',
    'template-d',
    'motorbike-template',
    'imports-template'
  );
  if unexpected is not null then
    raise exception
      'sellers.template has values that cannot convert to the rebuilt seller_template: %',
      unexpected;
  end if;
end $$;

create type public.seller_template_new as enum (
  'template-a',
  'sneaker-template',
  'kitchenware-template',
  'template-d',
  'motorbike-template',
  'imports-template'
);

alter table public.sellers
  alter column template type public.seller_template_new
  using (
    case
      when template::text = 'template-b' then 'sneaker-template'
      else template::text
    end
  )::public.seller_template_new;

drop type public.seller_template;

alter type public.seller_template_new rename to seller_template;
