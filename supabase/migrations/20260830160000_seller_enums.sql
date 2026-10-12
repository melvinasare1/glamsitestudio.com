-- Convert sellers.template, pricing_tier, and status from text + CHECK
-- to Postgres enums. Remap historical text values before the USING cast.
-- Does not assume which template CHECK is live (motorbike vs kitchenware).

do $$
declare
  rec record;
  unexpected text;
begin
  raise notice '--- live sellers CHECK constraints ---';
  for rec in
    select c.conname, pg_get_constraintdef(c.oid) as definition
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'sellers'
      and c.contype = 'c'
    order by c.conname
  loop
    raise notice '%: %', rec.conname, rec.definition;
  end loop;

  select string_agg(distinct template, ', ' order by template) into unexpected
  from public.sellers
  where template not in (
    'template-a',
    'template-b',
    'kitchenware-template',
    'template-d',
    'motorbike-template',
    'template-c'
  );
  if unexpected is not null then
    raise exception
      'sellers.template has values that cannot convert to seller_template: %',
      unexpected;
  end if;

  select string_agg(distinct pricing_tier, ', ' order by pricing_tier) into unexpected
  from public.sellers
  where pricing_tier not in (
    'early_bird',
    'standard',
    'website_admin',
    'fulfilment'
  );
  if unexpected is not null then
    raise exception
      'sellers.pricing_tier has values that cannot convert to seller_pricing_tier: %',
      unexpected;
  end if;

  select string_agg(distinct status, ', ' order by status) into unexpected
  from public.sellers
  where status not in ('onboarding', 'active', 'paused', 'offboarded');
  if unexpected is not null then
    raise exception
      'sellers.status has values that cannot convert to seller_status: %',
      unexpected;
  end if;
end $$;

-- Drop text CHECKs before remapping. website_admin / kitchenware-template
-- are not valid under the original early_bird / template-c CHECKs.
alter table public.sellers drop constraint if exists sellers_template_check;
alter table public.sellers drop constraint if exists sellers_pricing_tier_check;
alter table public.sellers drop constraint if exists sellers_status_check;

update public.sellers
set template = 'kitchenware-template'
where template = 'template-c';

update public.sellers
set pricing_tier = 'website_admin'
where pricing_tier = 'early_bird';

update public.sellers
set pricing_tier = 'fulfilment'
where pricing_tier = 'standard';

create type public.seller_template as enum (
  'template-a',
  'template-b',
  'kitchenware-template',
  'template-d',
  'motorbike-template'
);

create type public.seller_pricing_tier as enum (
  'website_admin',
  'fulfilment'
);

create type public.seller_status as enum (
  'onboarding',
  'active',
  'paused',
  'offboarded'
);

alter table public.sellers
  alter column template type public.seller_template
    using template::public.seller_template,
  alter column pricing_tier type public.seller_pricing_tier
    using pricing_tier::public.seller_pricing_tier,
  alter column status type public.seller_status
    using status::public.seller_status;
