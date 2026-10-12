-- Connected host is stored only when we have actually pointed a domain at
-- apps/web. Unconnected sellers keep domain null so middleware cannot match
-- a placeholder like {store_slug}.glamsitestudio.com or {store_slug}.local.

alter table public.sellers
  alter column domain drop not null;

alter table public.sellers
  alter column domain drop default;

alter table public.sellers
  alter column domain set default null;

update public.sellers
set domain = null
where
  domain is null
  or btrim(domain) = ''
  or lower(btrim(domain)) = lower(store_slug) || '.glamsitestudio.com'
  or lower(btrim(domain)) like '%.local';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sellers'
      and column_name = 'domain_verified'
  ) then
    update public.sellers
    set domain_verified = false
    where domain is null;
  end if;
end $$;

alter table public.sellers
  drop constraint if exists sellers_domain_not_apex;

alter table public.sellers
  add constraint sellers_domain_not_apex
  check (
    domain is null
    or lower(btrim(domain)) not in ('glamsitestudio.com', 'www.glamsitestudio.com')
  );

drop index if exists sellers_domain_unique;

create unique index sellers_domain_unique
  on public.sellers (lower(btrim(domain)))
  where domain is not null and btrim(domain) <> '';
