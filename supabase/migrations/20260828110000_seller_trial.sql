-- 30-day free trial, started when a seller completes onboarding.
-- Null means no trial (e.g. admin-created accounts that skip onboarding).

alter table public.sellers
  add column if not exists trial_ends_at timestamptz;
