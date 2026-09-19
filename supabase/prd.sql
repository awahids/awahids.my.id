-- Run once in the Supabase SQL Editor. Safe to re-run (idempotent).
-- Backs the PRD generator's daily quota and stored PRDs.

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

  return greatest(p_max - new_count, 0);
end;
$$;

create table if not exists public.prds (
  id text primary key,
  slug text unique not null,
  system_name text not null,
  version text not null default '1.0',
  status text not null default 'draft',
  source text not null default 'web',
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prds enable row level security;

-- Read is public so permalinks resolve without a session. There is deliberately
-- NO insert or update policy: writes go through the service role key only.
drop policy if exists "Public can read prds" on public.prds;
create policy "Public can read prds"
  on public.prds for select
  using (true);
