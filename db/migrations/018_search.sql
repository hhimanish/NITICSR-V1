-- Enterprise Search (ERT 10), scoped to what's real: Postgres's native
-- full-text search (tsvector/ts_rank) over entities that already exist —
-- no vector/embedding infrastructure, no external search vendor. This is
-- deliberately NOT "Enterprise RAG" — there's no ingested corpus for an
-- LLM to retrieve against, just keyword/stem-based ranking over real rows
-- the caller already has permission to read. See docs/ARCHITECTURE.md's
-- ERT 10 section.

CREATE INDEX IF NOT EXISTS idx_csr_projects_fts ON csr_projects
  USING GIN (to_tsvector('english', title || ' ' || coalesce(description, '')));

CREATE INDEX IF NOT EXISTS idx_governance_policies_fts ON governance_policies
  USING GIN (to_tsvector('english', title || ' ' || coalesce(content, '')));

CREATE INDEX IF NOT EXISTS idx_project_risks_fts ON project_risks
  USING GIN (to_tsvector('english', title || ' ' || coalesce(description, '')));

CREATE INDEX IF NOT EXISTS idx_incidents_fts ON incidents
  USING GIN (to_tsvector('english', description));
