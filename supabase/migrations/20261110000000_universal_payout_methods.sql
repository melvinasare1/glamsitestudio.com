-- Earn payout details were UK-bank-only (account number + sort code), but
-- referrers aren't all in the UK: the US mostly uses Zelle/Cash App/PayPal,
-- Canada uses Interac e-Transfer, and Europe uses IBAN/BIC. Replace the
-- UK-specific columns with a method + two generic identifier slots that
-- cover all of them, so the form (and what staff see) matches wherever the
-- referrer actually banks.

alter table public.platform_referral_payout_details
  rename column account_number to identifier;

alter table public.platform_referral_payout_details
  rename column sort_code to identifier_2;

alter table public.platform_referral_payout_details
  add column method text not null default 'bank_uk'
    check (method in ('bank_uk', 'iban', 'zelle', 'cashapp', 'paypal', 'interac'));

comment on column public.platform_referral_payout_details.identifier is
  'Primary payout identifier: account number (bank_uk), IBAN (iban), email/phone (zelle, interac), $cashtag (cashapp), or email (paypal).';
comment on column public.platform_referral_payout_details.identifier_2 is
  'Secondary identifier, only used by bank_uk (sort code) and iban (BIC/SWIFT). Blank otherwise.';
