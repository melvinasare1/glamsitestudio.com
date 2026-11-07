-- Undo 20261110000000_universal_payout_methods.sql.
-- Turn off or revert the Earn payout details UI/actions first -- they
-- read and write method/identifier/identifier_2.

alter table public.platform_referral_payout_details
  drop column method;

alter table public.platform_referral_payout_details
  rename column identifier_2 to sort_code;

alter table public.platform_referral_payout_details
  rename column identifier to account_number;
