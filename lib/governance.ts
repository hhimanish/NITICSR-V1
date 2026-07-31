import { getPool } from "@/lib/db";
import { findUserByClerkId } from "@/lib/users-repo";

/**
 * The immutable governance record: every approval-type action already in
 * the platform (CSR project approval, verification approve/reject) calls
 * this instead of just updating a status column, so there's a real,
 * append-only "who decided what, when, and why" trail — the actual
 * "system of record for governance decisions" from the ERT 1 brief,
 * without a fictional Board/Committee domain behind it.
 */
export async function recordDecision(input: {
  organizationId: string;
  decidedByClerkUserId: string;
  decisionType: string;
  entityType: string;
  entityId: string;
  rationale?: string;
  metadata?: Record<string, unknown>;
}) {
  const user = await findUserByClerkId(input.decidedByClerkUserId);
  await getPool().query(
    `INSERT INTO governance_decisions
       (organization_id, decided_by, decision_type, entity_type, entity_id, rationale, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.organizationId,
      user?.id ?? null,
      input.decisionType,
      input.entityType,
      input.entityId,
      input.rationale ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
}
