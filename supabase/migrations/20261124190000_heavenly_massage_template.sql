-- Add the Heavenly Massage spa template to the catalogue.
-- This is additive; existing template rows and business content are unchanged.
insert into public.templates (id, name, position)
values ('heavenly-massage', 'Heavenly Massage', 3)
on conflict (id) do nothing;
