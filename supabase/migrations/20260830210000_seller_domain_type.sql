-- Glam Site Studios-owned seller hosts: {store_slug}.glamsitestudio.com.
-- custom is defined for a later third-party domain flow and is unused here.

create type public.seller_domain_type as enum ('subdomain', 'custom');

alter table public.sellers
  add column if not exists domain_type public.seller_domain_type not null default 'subdomain',
  add column if not exists domain_verified boolean not null default false;

-- Existing rows are Glam Site Studios subdomains. We control DNS, so they are verified.
update public.sellers
set
  domain = store_slug || '.glamsitestudio.com',
  domain_type = 'subdomain',
  domain_verified = true;

alter table public.sellers
  drop constraint if exists sellers_store_slug_not_reserved;

alter table public.sellers
  add constraint sellers_store_slug_not_reserved
  check (
    store_slug not in (
      'www',
      'api',
      'dashboard',
      'app',
      'admin',
      'mail',
      'status',
      'cdn',
      'auth',
      'login',
      'signup',
      'staging',
      'preview'
    )
  );
