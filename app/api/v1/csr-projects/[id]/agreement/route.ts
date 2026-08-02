import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { UpsertGrantAgreementSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

type RouteContext = { params: Promise<{ id: string }> };

async function loadProjectOrgs(projectId: string) {
  const { rows } = await getPool().query(
    `SELECT p.corporate_org_id, np.organization_id AS ngo_org_id
       FROM csr_projects p
       LEFT JOIN ngo_profiles np ON np.id = p.ngo_profile_id
      WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [projectId]
  );
  return rows[0] ?? null;
}

// Both sides of a partnership can read the agreement — the corporate that
// wrote it and the NGO that has to acknowledge it — but only the corporate
// can create or edit it (PATCH below).
export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const orgs = await loadProjectOrgs(id);
  if (!orgs) return apiError(404, "Project not found");

  const isCorporateSide = await can(userId, orgs.corporate_org_id, "CSR.Project.Read");
  const isNgoSide = orgs.ngo_org_id && (await can(userId, orgs.ngo_org_id, "NGO.Profile.Read"));
  if (!isCorporateSide && !isNgoSide) {
    return apiError(403, "Missing required permission to view this project's agreement");
  }

  const { rows } = await getPool().query(
    `SELECT ga.id, ga.terms, ga.acknowledged_at, ga.created_at, ga.updated_at, u.full_name AS acknowledged_by_name
       FROM grant_agreements ga
       LEFT JOIN users u ON u.id = ga.acknowledged_by
      WHERE ga.csr_project_id = $1`,
    [id]
  );
  return apiSuccess(rows[0] ?? null);
});

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const orgs = await loadProjectOrgs(id);
  if (!orgs) return apiError(404, "Project not found");

  const input = UpsertGrantAgreementSchema.parse(await req.json());
  await requirePermission(userId, orgs.corporate_org_id, "CSR.Project.Write");

  const user = await findUserByClerkId(userId);
  // Editing the terms after acknowledgement clears it — the NGO acknowledged
  // specific terms, not whatever the corporate changes them to later.
  const { rows } = await getPool().query(
    `INSERT INTO grant_agreements (csr_project_id, terms, created_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (csr_project_id) DO UPDATE SET
       terms = EXCLUDED.terms,
       acknowledged_by = NULL,
       acknowledged_at = NULL
     RETURNING id, terms, acknowledged_at, created_at, updated_at`,
    [id, input.terms, user?.id ?? null]
  );
  return apiSuccess(rows[0]);
});
