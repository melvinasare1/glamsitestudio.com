-- Retire Stylehive (template-d). Rebuild seller_template without that value.
-- Leftover template-d rows remap to template-a (Simple / Studio) so the cast
-- succeeds. Do not apply this if a live seller must stay on Stylehive.

do $$
declare
  unexpected text;
begin
  select string_agg(distinct template::text, ', ' order by template::text)
    into unexpected
  from public.sellers
  where template::text not in (
    'template-a',
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
  'motorbike-template',
  'imports-template'
);

alter table public.sellers
  alter column template type public.seller_template_new
  using (
    case
      when template::text = 'template-d' then 'template-a'
      else template::text
    end
  )::public.seller_template_new;

drop type public.seller_template;

alter type public.seller_template_new rename to seller_template;
