-- Rate limiting for public API routes (booking, contact, leads, support).
-- An in-memory counter in the Next.js server wouldn't work: Vercel can route
-- requests from the same client to different serverless instances, so counts
-- never add up. This table is the shared counter every instance hits
-- instead, fixed-window per key (e.g. "booking:book:<ip>"), checked via
-- check_rate_limit() from packages/shared/src/rate-limit.ts.

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (key, window_start)
);

create index rate_limits_window_start_idx on public.rate_limits (window_start);

create function public.check_rate_limit(p_key text, p_window_seconds integer, p_max_requests integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into v_count;

  -- Opportunistic cleanup instead of a cron job: 1-in-50 calls sweeps windows
  -- that are long over, so the table doesn't grow forever.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 hour';
  end if;

  return v_count <= p_max_requests;
end;
$$;

-- Server only (service role), same as leads having no policies.
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;

alter table public.rate_limits enable row level security;
