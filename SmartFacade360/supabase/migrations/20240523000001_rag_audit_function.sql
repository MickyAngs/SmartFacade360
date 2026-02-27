-- SQL Functions for RAG and Audit Services
-- Requires pgvector extension to be enabled

create or replace function match_normative_knowledge (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  org_id uuid
)
returns table (
  id uuid,
  organization_id uuid,
  section text,
  content text,
  source text,
  similarity float
)
language sql stable
as $$
  select
    normative_knowledge.id,
    normative_knowledge.organization_id,
    normative_knowledge.section,
    normative_knowledge.content,
    normative_knowledge.source,
    1 - (normative_knowledge.embedding <=> query_embedding) as similarity
  from normative_knowledge
  where 1 - (normative_knowledge.embedding <=> query_embedding) > match_threshold
    and normative_knowledge.organization_id = org_id
  order by normative_knowledge.embedding <=> query_embedding
  limit match_count;
$$;
