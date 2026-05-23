
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
security invoker
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

revoke execute on function public.match_kb_documents(vector, int, text, text) from public, anon, authenticated;
grant execute on function public.match_kb_documents(vector, int, text, text) to service_role;
