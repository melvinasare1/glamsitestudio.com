-- Verify page: persist return policy and mark a seller as submitted for
-- manual review without adding a new sellers.status enum value.
-- status stays onboarding | active | paused | offboarded; Publish sets
-- verification_submitted_at so admins can see who is ready.

alter table public.sellers
  add column if not exists return_policy text not null default '',
  add column if not exists verification_submitted_at timestamptz;

create index if not exists sellers_verification_submitted_at_idx
  on public.sellers (verification_submitted_at desc)
  where verification_submitted_at is not null;
