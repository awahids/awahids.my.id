-- Run this once in the Supabase SQL Editor to enable the README generator's
-- visitor counter (api/visitor-count.js). Safe to re-run (idempotent).

create table if not exists public.page_views (
  key text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.page_views enable row level security;

drop policy if exists "Allow public read of page_views" on public.page_views;
create policy "Allow public read of page_views"
  on public.page_views for select
  using (true);

-- security definer: runs with the table owner's privileges so the public
-- anon key can bump a counter without needing direct write access to the
-- table (which would otherwise let anyone set an arbitrary count).
create or replace function public.increment_page_view(view_key text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.page_views (key, count, updated_at)
  values (view_key, 1, now())
  on conflict (key) do update
    set count = page_views.count + 1, updated_at = now()
  returning count into new_count;

  return new_count;
end;
$$;

grant execute on function public.increment_page_view(text) to anon, authenticated;
