
create extension if not exists vector;

create table if not exists public.kb_documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  source text not null default 'NCTB Chemistry Book',
  class text not null default '9-10',
  subject text not null default 'Chemistry',
  chapter text,
  page int,
  chunk_index int,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists kb_documents_embedding_idx
  on public.kb_documents using hnsw (embedding vector_cosine_ops);

create index if not exists kb_documents_source_idx on public.kb_documents (source);
create index if not exists kb_documents_subject_idx on public.kb_documents (subject);

alter table public.kb_documents enable row level security;

-- Knowledge base is shared study material: anyone can read.
create policy "KB readable by everyone"
  on public.kb_documents for select
  using (true);

-- Writes only via service role (server functions). No INSERT/UPDATE/DELETE policy
-- for anon/authenticated => effectively denied. supabaseAdmin bypasses RLS.

create or replace function public.match_kb_documents (
  query_embedding vector(1536),
  match_count int default 6,
  filter_source text default null,
  filter_subject text default null
)
returns table (
  id uuid,
  content text,
  source text,
  class text,
  subject text,
  chapter text,
  page int,
  metadata jsonb,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.id,
    d.content,
    d.source,
    d.class,
    d.subject,
    d.chapter,
    d.page,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.kb_documents d
  where (filter_source is null or d.source = filter_source)
    and (filter_subject is null or d.subject = filter_subject)
  order by d.embedding <=> query_embedding
  limit match_count;
$$;
