import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { ReviewNgoDocumentSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const input = ReviewNgoDocumentSchema.parse(await req.json());

  // Mirrors the verification-requests review pattern: the reviewer's own
  // (auditor/platform_admin) organization is what's permission-checked,
  // not the NGO's — this is a cross-tenant review action.
  await requirePermission(userId, input.organizationId, "NGO.Verify");

  const { rows } = await getPool().query(
    `UPDATE ngo_documents SET status = $1 WHERE id = $2
     RETURNING id, document_type, file_url, issued_at, expires_at, status`,
    [input.status, id]
  );
  if (rows.length === 0) return apiError(404, "Document not found");
  return apiSuccess(rows[0]);
});
