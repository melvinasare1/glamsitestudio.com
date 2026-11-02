-- Booking UI, phase 1.5: service photos and an owner-configurable payment policy.
--
-- The payment policy is informational only for now — there's no Stripe
-- Connect integration yet (see docs/build-plan.md). Clients see what
-- they'll be asked to pay; nothing is actually charged until that lands.

alter table public.services
  add column image_url text not null default '';

alter table public.booking_settings
  add column payment_policy text not null default 'none'
    check (payment_policy in ('none', 'full', 'deposit_50', 'deposit_fixed')),
  add column deposit_fixed_cents integer
    check (deposit_fixed_cents is null or deposit_fixed_cents >= 0);
