import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { validateSurveyAnswers, type SurveyQuestion } from "@/lib/field-intelligence";
import { requirePermission } from "@/lib/rbac";
import { CreateSurveyResponseSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

type RouteContext = { params: Promise<{ id: string }> };

async function loadSurvey(surveyId: string) {
  const { rows } = await getPool().query(
    `SELECT organization_id, questions FROM survey_definitions WHERE id = $1`,
    [surveyId]
  );
  return rows[0] ?? null;
}

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const survey = await loadSurvey(id);
  if (!survey) return apiError(404, "Survey not found");

  await requirePermission(userId, survey.organization_id, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT sr.id, sr.csr_project_id, sr.beneficiary_id, sr.answers, sr.created_at, u.full_name AS submitted_by_name
       FROM survey_responses sr
       LEFT JOIN users u ON u.id = sr.submitted_by
      WHERE sr.survey_definition_id = $1
      ORDER BY sr.created_at DESC`,
    [id]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const survey = await loadSurvey(id);
  if (!survey) return apiError(404, "Survey not found");

  const input = CreateSurveyResponseSchema.parse(await req.json());
  await requirePermission(userId, survey.organization_id, "CSR.Project.Write");

  const { valid, errors } = validateSurveyAnswers(survey.questions as SurveyQuestion[], input.answers);
  if (!valid) return apiError(400, errors.join("; "));

  const user = await findUserByClerkId(userId);
  const { rows } = await getPool().query(
    `INSERT INTO survey_responses (survey_definition_id, csr_project_id, beneficiary_id, answers, submitted_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, csr_project_id, beneficiary_id, answers, created_at`,
    [id, input.csrProjectId ?? null, input.beneficiaryId ?? null, JSON.stringify(input.answers), user?.id ?? null]
  );
  return apiSuccess(rows[0]);
});
