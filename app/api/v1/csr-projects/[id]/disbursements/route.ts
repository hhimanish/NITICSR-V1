import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { getDisbursementSummary } from "@/lib/grants";
import { requirePermission } from "@/lib/rbac";
import { CreateDisbursementSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

type RouteContext = { params: Promise<{ id: string }> };

async function loadProject(projectId: string) {
  const { rows } = await getPool().query(
    `SELECT corporate_org_id, budget_amount, status FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [projectId]
  );
  return rows[0] ?? null;
}

/** A project found during manual QA could take a disbursement while still
 * "draft" — no NGO, no approval, 0% compliance (NITICSR-PROJ-002). Funds can
 * only be recorded against a project that's actually been approved. */
const DISBURSABLE_STATUSES = ["approved", "active", "completed"];

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return apiError(404, "Project not found");

  await requirePermission(userId, project.corporate_org_id, "CSR.Project.Read");

  const pool = getPool();
  const [{ rows: disbursements }, summary] = await Promise.all([
    pool.query(
      `SELECT d.id, d.milestone_id, d.amount, d.note, d.vendor_name, d.expense_category,
              d.invoice_reference, d.created_at, u.full_name AS recorded_by_name
         FROM disbursements d
         LEFT JOIN users u ON u.id = d.recorded_by
        WHERE d.csr_project_id = $1
        ORDER BY d.created_at DESC`,
      [id]
    ),
    getDisbursementSummary(id, project.budget_amount ? Number(project.budget_amount) : null),
  ]);

  return apiSuccess({ disbursements, summary });
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return apiError(404, "Project not found");

  const input = CreateDisbursementSchema.parse(await req.json());
  await requirePermission(userId, project.corporate_org_id, "CSR.Project.Write");

  if (!DISBURSABLE_STATUSES.includes(project.status)) {
    return apiError(400, `Cannot record a disbursement against a project that is still "${project.status}" — approve it first`);
  }

  const budgetAmount = project.budget_amount ? Number(project.budget_amount) : null;
  if (budgetAmount !== null) {
    const summary = await getDisbursementSummary(id, budgetAmount);
    if (summary.totalDisbursed + input.amount > budgetAmount) {
      return apiError(400, "Disbursement would exceed the project's budget");
    }
  }

  const user = await findUserByClerkId(userId);
  const { rows } = await getPool().query(
    `INSERT INTO disbursements
       (csr_project_id, milestone_id, amount, note, vendor_name, expense_category, invoice_reference, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, milestone_id, amount, note, vendor_name, expense_category, invoice_reference, created_at`,
    [
      id,
      input.milestoneId ?? null,
      input.amount,
      input.note ?? null,
      input.vendorName ?? null,
      input.expenseCategory ?? null,
      input.invoiceReference ?? null,
      user?.id ?? null,
    ]
  );
  return apiSuccess(rows[0]);
});
