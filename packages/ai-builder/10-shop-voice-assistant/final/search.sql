create extension if not exists vector;

create table documents (
  id bigserial primary key,
  content text,                 -- the chunk of text
  metadata jsonb,               -- where it came from, e.g. {"file":"products.txt"}
  embedding vector(1536)        -- must match your embedding model
);

create function match_documents (
  query_embedding vector(1536),
  match_count int default 3,
  filter jsonb default '{}'
) returns table (id bigint, content text, metadata jsonb, similarity float)
language plpgsql as $$
#variable_conflict use_column
begin
  return query
  select id, content, metadata,
         1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
