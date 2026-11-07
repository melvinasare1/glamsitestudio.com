-- Undo 20261109000000_platform_referrals.sql.
-- Turn off or revert the "Earn" referral UI/actions first -- they insert
-- into and read from these tables.

drop table if exists public.platform_referral_payout_details;
drop table if exists public.platform_referral_earnings;
drop table if exists public.platform_referrals;
