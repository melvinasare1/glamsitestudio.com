-- Template 1: Luxe (hair). Adding a template is a row here plus its entry in
-- packages/shared/src/templates.ts.
insert into public.templates (id, name, position) values ('luxe', 'Luxe', 0)
on conflict (id) do nothing;
