-- Run this once in the Supabase SQL Editor to enable the AI assistant's Q&A
-- archive (api/_lib/qaArchive.js). Safe to re-run (idempotent).
--
-- Phase 1 of the RAG work: collect the corpus. Phase 2 adds an `embedding`
-- column and similarity search on top of this same table, so nothing here
-- needs the pgvector extension yet.

create table if not exists public.assistant_qa (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  question text not null,
  answer text not null,
  language text not null default '',
  created_at timestamptz not null default now()
);

-- Supports the retention sweep, which deletes by created_at on every insert.
create index if not exists assistant_qa_created_at_idx
  on public.assistant_qa (created_at);

-- RLS on with NO policies at all: this table holds visitors' questions, so
-- neither anon nor authenticated may read or write it. The anon key is public
-- (VITE_ vars are inlined into the client bundle), so a policy for it would be
-- a policy for everyone. The service role bypasses RLS and is the only writer;
-- it lives server-side in api/_lib/qaArchive.js and nowhere else.
alter table public.assistant_qa enable row level security;

-- Read the archive from the Supabase dashboard or SQL Editor, e.g.:
--   select created_at, route, question from public.assistant_qa
--   order by created_at desc limit 50;
