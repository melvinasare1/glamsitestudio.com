-- Done-for-you leads now pick a call time themselves instead of filling in
-- an intake form and waiting for us to reach out (apps/web/src/components/
-- marketing/LeadForm.tsx). Null for any other lead source.
alter table public.leads
  add column call_at timestamptz;
