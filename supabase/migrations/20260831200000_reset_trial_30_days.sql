-- Fresh 30-day trial for every seller, including existing accounts whose
-- trial_ends_at was shorter, already elapsed, or never set.

update public.sellers
set trial_ends_at = now() + interval '30 days';
