import { getPool } from "@/lib/db";

/**
 * Enterprise Search (ERT 10) — Postgres full-text search (tsvector/ts_rank)
 * over an organization's own real records: projects, governance policies,
 * risks/issues, and incidents. Deliberately not "Enterprise RAG" — there's
 * no ingested document corpus or embedding index, just keyword/stem-based
 * ranking over rows the caller already has permission to read. Scoped to
 * a single organization's own data (the entities that share
 * CSR.Project.Read as their permission) rather than also spanning the
 * cross-tenant NGO directory, which already has its own dedicated search
 * with filters (see /api/v1/ngo-profiles).
 */

export type SearchResult = {
  entityType: "project" | "policy" | "risk" | "incident";
  id: string;
  title: string;
  snippet: string;
  url: string;
  rank: number;
};

const RESULT_LIMIT_PER_TYPE = 8;

export async function searchOrganization(organizationId: string, query: string): Promise<SearchResult[]> {
  const pool = getPool();

  const [projects, policies, risks, incidents] = await Promise.all([
    pool.query(
      `SELECT id, title,
              ts_headline('english', coalesce(description, ''), plainto_tsquery('english', $2), 'StartSel=, StopSel=, MaxWords=20, MinWords=6') AS snippet,
              ts_rank(to_tsvector('english', title || ' ' || coalesce(description, '')), plainto_tsquery('english', $2)) AS rank
         FROM csr_projects
        WHERE corporate_org_id = $1 AND deleted_at IS NULL
          AND to_tsvector('english', title || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', $2)
        ORDER BY rank DESC LIMIT ${RESULT_LIMIT_PER_TYPE}`,
      [organizationId, query]
    ),
    pool.query(
      `SELECT id, title,
              ts_headline('english', content, plainto_tsquery('english', $2), 'StartSel=, StopSel=, MaxWords=20, MinWords=6') AS snippet,
              ts_rank(to_tsvector('english', title || ' ' || coalesce(content, '')), plainto_tsquery('english', $2)) AS rank
         FROM governance_policies
        WHERE organization_id = $1
          AND to_tsvector('english', title || ' ' || coalesce(content, '')) @@ plainto_tsquery('english', $2)
        ORDER BY rank DESC LIMIT ${RESULT_LIMIT_PER_TYPE}`,
      [organizationId, query]
    ),
    pool.query(
      `SELECT id, title,
              ts_headline('english', coalesce(description, ''), plainto_tsquery('english', $2), 'StartSel=, StopSel=, MaxWords=20, MinWords=6') AS snippet,
              ts_rank(to_tsvector('english', title || ' ' || coalesce(description, '')), plainto_tsquery('english', $2)) AS rank
         FROM project_risks
        WHERE organization_id = $1
          AND to_tsvector('english', title || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', $2)
        ORDER BY rank DESC LIMIT ${RESULT_LIMIT_PER_TYPE}`,
      [organizationId, query]
    ),
    pool.query(
      `SELECT id, description,
              ts_headline('english', description, plainto_tsquery('english', $2), 'StartSel=, StopSel=, MaxWords=20, MinWords=6') AS snippet,
              ts_rank(to_tsvector('english', description), plainto_tsquery('english', $2)) AS rank
         FROM incidents
        WHERE organization_id = $1
          AND to_tsvector('english', description) @@ plainto_tsquery('english', $2)
        ORDER BY rank DESC LIMIT ${RESULT_LIMIT_PER_TYPE}`,
      [organizationId, query]
    ),
  ]);

  const results: SearchResult[] = [
    ...projects.rows.map((r) => ({
      entityType: "project" as const,
      id: r.id,
      title: r.title,
      snippet: r.snippet,
      url: `/corporate/projects/${r.id}`,
      rank: Number(r.rank),
    })),
    ...policies.rows.map((r) => ({
      entityType: "policy" as const,
      id: r.id,
      title: r.title,
      snippet: r.snippet,
      url: `/corporate/governance`,
      rank: Number(r.rank),
    })),
    ...risks.rows.map((r) => ({
      entityType: "risk" as const,
      id: r.id,
      title: r.title,
      snippet: r.snippet,
      url: `/corporate/assurance`,
      rank: Number(r.rank),
    })),
    ...incidents.rows.map((r) => ({
      entityType: "incident" as const,
      id: r.id,
      title: r.description.length > 60 ? `${r.description.slice(0, 60)}…` : r.description,
      snippet: r.snippet,
      url: `/corporate/assurance`,
      rank: Number(r.rank),
    })),
  ];

  return results.sort((a, b) => b.rank - a.rank);
}
