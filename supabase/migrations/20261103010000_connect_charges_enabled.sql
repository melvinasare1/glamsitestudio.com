-- Stripe Connect (stage 5 phase 2): business_billing.stripe_connect_account_id
-- already exists (baseline). This tracks whether that Express account can
-- actually accept charges yet, kept in sync by the account.updated webhook.

alter table public.business_billing
  add column stripe_connect_charges_enabled boolean not null default false;
