import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { apiError, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { generateQrCodeSvg } from "@/lib/field-intelligence";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

/** Returns an inline SVG QR code linking to this project's detail page —
 * generated locally (see lib/field-intelligence.ts), no external API call. */
export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const { rows } = await getPool().query(
    `SELECT corporate_org_id FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (rows.length === 0) return apiError(404, "Project not found");
  await requirePermission(userId, rows[0].corporate_org_id, "CSR.Project.Read");

  const url = new URL(`/corporate/projects/${id}`, req.nextUrl.origin).toString();
  const svg = await generateQrCodeSvg(url);
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml" } });
});
