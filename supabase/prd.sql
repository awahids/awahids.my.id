-- Run once in the Supabase SQL Editor. Safe to re-run (idempotent).
-- Backs the PRD generator's daily quota.
--
-- Saved PRDs go into public.prds, which belongs to the aw-prd app and is NOT
-- created or altered here: api/_lib/prdStore.js writes and reads it with the
-- service role key as PRD_OWNER_USER_ID. Never add a public select policy to
-- it: the table is shared, and such a policy would expose every user's rows.

create table if not exists public.prd_quota (
  ip_hash text not null,
  day date not null,
  count integer not null default 0,
  primary key (ip_hash, day)
);

alter table public.prd_quota enable row level security;

-- security definer so the public anon key can consume an allowance without
-- being able to write the table directly (which would let anyone set it to 0).
create or replace function public.increment_prd_quota(p_ip_hash text, p_day date, p_max integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.prd_quota (ip_hash, day, count)
  values (p_ip_hash, p_day, 1)
  on conflict (ip_hash, day)
  do update set count = public.prd_quota.count + 1
  returning count into new_count;

  -- Unclamped on purpose: 0 = this call used the last slot, negative = over.
  return p_max - new_count;
end;
$$;
