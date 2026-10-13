-- Fixes from the Supabase security advisor on the new Glam Site Studios projects.

-- Pin search_path on trigger functions (both bodies are fully schema-qualified).
alter function public.sellers_set_billing_reference() set search_path = '';
alter function public.sellers_protect_billing_columns() set search_path = '';

-- Supabase adds public.rls_auto_enable() (an event-trigger function that turns
-- on RLS for new tables) to some new projects. It runs from its event trigger as
-- its owner; nobody needs to call it through the API.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
