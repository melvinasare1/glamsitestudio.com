-- Lets an owner preview their own draft site at a public-looking URL before
-- it's live, without weakening businesses_read (anon still only sees status
-- = 'live'). apps/web fetches the draft row with the service-role client
-- when the token in the URL matches this column — same shape as
-- appointments.manage_token.
alter table public.businesses
  add column preview_token uuid not null default gen_random_uuid();

create unique index businesses_preview_token_idx on public.businesses (preview_token);
