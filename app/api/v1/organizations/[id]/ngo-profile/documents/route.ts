import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateNgoDocumentSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

async function loadNgoProfileId(organizationId: string) {
  const { rows } = await getPool().query(
    `SELECT id FROM ngo_profiles WHERE organization_id = $1 AND deleted_at IS NULL`,
    [organizationId]
  );
  return rows[0]?.id ?? null;
}

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "NGO.Profile.Read");

  const ngoProfileId = await loadNgoProfileId(organizationId);
  if (!ngoProfileId) return apiError(404, "No NGO profile for this organization yet");

  const { rows } = await getPool().query(
    `SELECT id, document_type, file_url, issued_at, expires_at, status, created_at
       FROM ngo_documents WHERE ngo_profile_id = $1 ORDER BY created_at DESC`,
    [ngoProfileId]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "NGO.Profile.Write");

  const input = CreateNgoDocumentSchema.parse(await req.json());
  const ngoProfileId = await loadNgoProfileId(organizationId);
  if (!ngoProfileId) return apiError(404, "No NGO profile for this organization yet");

  const { rows } = await getPool().query(
    `INSERT INTO ngo_documents (ngo_profile_id, document_type, file_url, issued_at, expires_at, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, (SELECT id FROM users WHERE clerk_user_id = $6))
     RETURNING id, document_type, file_url, issued_at, expires_at, status, created_at`,
    [ngoProfileId, input.documentType, input.fileUrl ?? null, input.issuedAt ?? null, input.expiresAt ?? null, userId]
  );

  return apiSuccess(rows[0]);
});
