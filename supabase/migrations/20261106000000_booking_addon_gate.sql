-- Booking add-on gate (docs/follow-ups.md: "Any owner can turn on Glam Site
-- booking. It should come with the booking add-on. Trigger: stage 3
-- billing" — now hit). Turning booking_mode to 'glamsite' is gated on
-- business_billing.booking_addon from here on (enforced in
-- apps/dashboard/src/app/(owner)/booking/actions.ts saveBooking, and the
-- add-on itself is bought/removed as a second Stripe subscription item via
-- enableBookingAddon/disableBookingAddon in billing/actions.ts).
--
-- Tracks the Stripe subscription item id for the add-on so it can be
-- removed precisely later, instead of searching the subscription's items by
-- price.
alter table public.business_billing
  add column stripe_booking_addon_item_id text;

-- Grandfather: any business already using Glam Site booking today keeps it,
-- so nobody already relying on it loses it the moment this gate ships.
update public.business_billing b
set booking_addon = true
from public.businesses biz
where biz.id = b.business_id
  and biz.booking_mode = 'glamsite'
  and b.booking_addon = false;
