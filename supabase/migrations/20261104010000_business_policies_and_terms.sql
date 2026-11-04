-- Free-text policies/terms an owner can show clients (e.g. cancellation
-- policy, terms of service). Plain text, owner-authored, no rich content —
-- keep it simple until a template actually needs to render it (AGENTS.md:
-- ship what the next stage needs).
alter table public.businesses
  add column policies_text text,
  add column terms_text text;
