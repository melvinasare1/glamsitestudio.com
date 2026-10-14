-- Glam Site Studios baseline schema.
--
-- Replaces the Ansaa product-shop migrations with an appointment-first model
-- for hair and beauty businesses. One shared database; every row belongs to
-- one business and row-level security keeps businesses apart (rule 7).
--
-- Conventions
--   weekday      0 = Monday … 6 = Sunday
--   *_cents      integer minor units in the business's currency
--   times        `time` columns are local to businesses.timezone;
--                appointment instants are timestamptz
--   Writes that need checks (sign-up, billing, slugs, domains, bookings from
--   the public site) go through server code using the service role.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Templates (the website designs we sell)
-- ---------------------------------------------------------------------------

create table public.templates (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  price_cents integer check (price_cents is null or price_cents >= 0),
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.templates (id, name, position) values
  ('salon', 'Salon', 1),
  ('barber', 'Barber', 2);

-- ---------------------------------------------------------------------------
-- Businesses (one per salon; public profile and site content)
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slug text not null unique check (
    char_length(slug) between 2 and 63
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and slug not in (
      'www', 'api', 'app', 'admin', 'dashboard', 'mail', 'status', 'cdn', 'auth',
      'login', 'signup', 'staging', 'preview', 'demo', 'help', 'support', 'blog'
    )
  ),
  template_id text not null default 'salon' references public.templates (id) on update cascade,
  status text not null default 'draft' check (status in ('draft', 'live', 'paused')),
  custom_domain text unique check (
    custom_domain is null or (custom_domain = lower(custom_domain) and custom_domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$')
  ),
  custom_domain_verified boolean not null default false,
  email text not null default '',
  phone text not null default '',
  address_line1 text not null default '',
  address_line2 text not null default '',
  city text not null default '',
  postcode text not null default '',
  country text not null default 'GB' check (country ~ '^[A-Z]{2}$'),
  timezone text not null default 'Europe/London',
  currency text not null default 'GBP' check (currency ~ '^[A-Z]{3}$'),
  booking_mode text not null default 'none' check (booking_mode in ('none', 'link', 'glamsite')),
  booking_url text not null default '',
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_owner_id_idx on public.businesses (owner_id);
create index businesses_template_id_idx on public.businesses (template_id);

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Billing (private; written only by server code, e.g. Stripe webhooks)
-- ---------------------------------------------------------------------------

create table public.business_billing (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  plan text not null default 'diy' check (plan in ('diy', 'done_for_you')),
  subscription_status text not null default 'none' check (
    subscription_status in ('none', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete')
  ),
  booking_addon boolean not null default false,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_connect_account_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger business_billing_set_updated_at
before update on public.business_billing
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Opening hours (shown on the site; several rows a day allow split shifts)
-- ---------------------------------------------------------------------------

create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  check (closes_at > opens_at)
);

create index opening_hours_business_id_idx on public.opening_hours (business_id, weekday);

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (business_id, name),
  unique (id, business_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  category_id uuid,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text not null default '',
  duration_minutes integer not null check (duration_minutes between 5 and 720),
  price_cents integer check (price_cents is null or price_cents >= 0),
  price_is_from boolean not null default false,
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 240),
  deposit_cents integer check (deposit_cents is null or deposit_cents >= 0),
  is_visible boolean not null default true,
  is_bookable boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id),
  foreign key (category_id, business_id)
    references public.service_categories (id, business_id) on delete set null (category_id)
);

create index services_business_id_idx on public.services (business_id, position);
create index services_category_id_idx on public.services (category_id);

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Team
-- ---------------------------------------------------------------------------

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  role text not null default '',
  bio text not null default '',
  photo_url text not null default '',
  is_visible boolean not null default true,
  is_bookable boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);

create index staff_business_id_idx on public.staff (business_id, position);

create trigger staff_set_updated_at
before update on public.staff
for each row execute function public.set_updated_at();

-- Which services each team member does.
create table public.staff_services (
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid not null,
  service_id uuid not null,
  primary key (staff_id, service_id),
  foreign key (staff_id, business_id) references public.staff (id, business_id) on delete cascade,
  foreign key (service_id, business_id) references public.services (id, business_id) on delete cascade
);

create index staff_services_business_id_idx on public.staff_services (business_id);
create index staff_services_service_id_idx on public.staff_services (service_id, business_id);

-- ---------------------------------------------------------------------------
-- Booking (used from stage 5; the shape is fixed now)
-- ---------------------------------------------------------------------------

create table public.staff_working_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  check (ends_at > starts_at),
  foreign key (staff_id, business_id) references public.staff (id, business_id) on delete cascade
);

create index staff_working_hours_business_id_idx on public.staff_working_hours (business_id);
create index staff_working_hours_staff_id_idx on public.staff_working_hours (staff_id, business_id, weekday);

-- Holidays and closures. A null staff_id closes the whole business.
create table public.staff_time_off (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (staff_id, business_id) references public.staff (id, business_id) on delete cascade
);

create index staff_time_off_business_id_idx on public.staff_time_off (business_id, starts_at);
create index staff_time_off_staff_id_idx on public.staff_time_off (staff_id, business_id);

create table public.booking_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  slot_interval_minutes integer not null default 15 check (slot_interval_minutes in (5, 10, 15, 20, 30, 60)),
  min_notice_minutes integer not null default 120 check (min_notice_minutes between 0 and 20160),
  max_advance_days integer not null default 60 check (max_advance_days between 1 and 365),
  cancellation_notice_hours integer not null default 24 check (cancellation_notice_hours between 0 and 336),
  auto_confirm boolean not null default true,
  require_deposit boolean not null default false,
  policy_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger booking_settings_set_updated_at
before update on public.booking_settings
for each row execute function public.set_updated_at();

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null default '',
  phone text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);

create unique index clients_business_email_key
  on public.clients (business_id, lower(email)) where email <> '';
create index clients_business_id_idx on public.clients (business_id, name);

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid,
  service_id uuid,
  staff_id uuid,
  -- Snapshot of what was booked, so edits to the service don't rewrite history.
  service_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (
    status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text not null default 'GBP' check (currency ~ '^[A-Z]{3}$'),
  deposit_cents integer not null default 0 check (deposit_cents >= 0),
  deposit_status text not null default 'none' check (
    deposit_status in ('none', 'pending', 'paid', 'refunded', 'forfeited')
  ),
  stripe_payment_intent_id text unique,
  source text not null default 'online' check (source in ('online', 'manual')),
  client_notes text not null default '',
  internal_notes text not null default '',
  -- Secret for the client's reschedule / cancel link.
  manage_token uuid not null default gen_random_uuid() unique,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (client_id, business_id) references public.clients (id, business_id) on delete set null (client_id),
  foreign key (service_id, business_id) references public.services (id, business_id) on delete set null (service_id),
  foreign key (staff_id, business_id) references public.staff (id, business_id) on delete set null (staff_id),
  -- A team member can't hold two live appointments at the same time.
  constraint appointments_no_double_booking exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (staff_id is not null and status in ('pending', 'confirmed'))
);

create index appointments_business_starts_idx on public.appointments (business_id, starts_at);
create index appointments_client_id_idx on public.appointments (client_id, business_id);
create index appointments_service_id_idx on public.appointments (service_id, business_id);

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Messages from the site's contact form, and our own marketing leads
-- ---------------------------------------------------------------------------

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null default '',
  phone text not null default '',
  message text not null check (char_length(btrim(message)) between 1 and 4000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index enquiries_business_id_idx on public.enquiries (business_id, created_at desc);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  business_name text not null default '',
  email text not null default '',
  phone text not null default '',
  message text not null default '',
  source text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.templates enable row level security;
alter table public.businesses enable row level security;
alter table public.business_billing enable row level security;
alter table public.opening_hours enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.staff_services enable row level security;
alter table public.staff_working_hours enable row level security;
alter table public.staff_time_off enable row level security;
alter table public.booking_settings enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.enquiries enable row level security;
alter table public.leads enable row level security;

-- Templates: anyone can see the catalogue.
create policy templates_read on public.templates
  for select to anon, authenticated
  using (true);

-- Businesses: live sites are public; owners always see their own.
-- Creating, deleting, slugs and domains go through server code.
create policy businesses_read on public.businesses
  for select to anon, authenticated
  using (status = 'live' or owner_id = (select auth.uid()));

create policy businesses_owner_update on public.businesses
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Billing: owners can read their own; only server code writes.
create policy business_billing_owner_read on public.business_billing
  for select to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

-- Site data shown publicly: readable on live sites, editable by the owner.
-- opening_hours, service_categories, staff_services
create policy opening_hours_read on public.opening_hours
  for select to anon, authenticated
  using (business_id in (select id from public.businesses where status = 'live' or owner_id = (select auth.uid())));
create policy opening_hours_owner_insert on public.opening_hours
  for insert to authenticated
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy opening_hours_owner_update on public.opening_hours
  for update to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy opening_hours_owner_delete on public.opening_hours
  for delete to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

create policy service_categories_read on public.service_categories
  for select to anon, authenticated
  using (business_id in (select id from public.businesses where status = 'live' or owner_id = (select auth.uid())));
create policy service_categories_owner_insert on public.service_categories
  for insert to authenticated
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy service_categories_owner_update on public.service_categories
  for update to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy service_categories_owner_delete on public.service_categories
  for delete to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

create policy staff_services_read on public.staff_services
  for select to anon, authenticated
  using (business_id in (select id from public.businesses where status = 'live' or owner_id = (select auth.uid())));
create policy staff_services_owner_insert on public.staff_services
  for insert to authenticated
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy staff_services_owner_delete on public.staff_services
  for delete to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

-- services and staff: hidden rows are only visible to the owner.
create policy services_read on public.services
  for select to anon, authenticated
  using (
    business_id in (select id from public.businesses where owner_id = (select auth.uid()))
    or (is_visible and business_id in (select id from public.businesses where status = 'live'))
  );
create policy services_owner_insert on public.services
  for insert to authenticated
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy services_owner_update on public.services
  for update to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy services_owner_delete on public.services
  for delete to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

create policy staff_read on public.staff
  for select to anon, authenticated
  using (
    business_id in (select id from public.businesses where owner_id = (select auth.uid()))
    or (is_visible and business_id in (select id from public.businesses where status = 'live'))
  );
create policy staff_owner_insert on public.staff
  for insert to authenticated
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy staff_owner_update on public.staff
  for update to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy staff_owner_delete on public.staff
  for delete to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

-- Private business data: owner only. Public booking runs through server code.
create policy staff_working_hours_owner_all on public.staff_working_hours
  for all to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

create policy staff_time_off_owner_all on public.staff_time_off
  for all to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

create policy booking_settings_owner_all on public.booking_settings
  for all to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

create policy clients_owner_all on public.clients
  for all to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

create policy appointments_owner_all on public.appointments
  for all to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

-- Enquiries arrive through server code (spam checks); owners read and tidy them.
create policy enquiries_owner_read on public.enquiries
  for select to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy enquiries_owner_update on public.enquiries
  for update to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy enquiries_owner_delete on public.enquiries
  for delete to authenticated
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

-- leads: no policies; server code only.

-- ---------------------------------------------------------------------------
-- Table privileges (least privilege on top of RLS)
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

grant select on public.templates to anon, authenticated;

grant select on public.businesses to anon, authenticated;
-- Owners can't change ownership, slug, domain or verification themselves.
grant update (
  name, template_id, status, email, phone, address_line1, address_line2, city, postcode,
  country, timezone, currency, booking_mode, booking_url, content, published_at
) on public.businesses to authenticated;

grant select on public.business_billing to authenticated;

grant select on public.opening_hours, public.service_categories, public.services,
  public.staff, public.staff_services to anon, authenticated;
grant insert, update, delete on public.opening_hours, public.service_categories,
  public.services, public.staff to authenticated;
grant insert, delete on public.staff_services to authenticated;

grant select, insert, update, delete on public.staff_working_hours, public.staff_time_off,
  public.clients, public.appointments to authenticated;
grant select, insert, update on public.booking_settings to authenticated;
grant select, update, delete on public.enquiries to authenticated;

grant all on all tables in schema public to service_role;

-- ---------------------------------------------------------------------------
-- Storage: one public bucket for site photos, one folder per business
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
on conflict (id) do nothing;

create policy site_media_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and (storage.foldername(name))[1] in (
      select id::text from public.businesses where owner_id = (select auth.uid())
    )
  );

create policy site_media_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'site-media'
    and (storage.foldername(name))[1] in (
      select id::text from public.businesses where owner_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'site-media'
    and (storage.foldername(name))[1] in (
      select id::text from public.businesses where owner_id = (select auth.uid())
    )
  );

create policy site_media_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'site-media'
    and (storage.foldername(name))[1] in (
      select id::text from public.businesses where owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Supabase adds public.rls_auto_enable() (an event-trigger function) to some
-- new projects. It runs from its event trigger; nobody needs it via the API.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
