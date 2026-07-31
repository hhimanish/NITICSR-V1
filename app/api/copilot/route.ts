import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { buildCopilotMessages, CEREBRAS_MODEL, getCerebrasClient } from "@/lib/cerebras";
import { getPool } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { requirePermission } from "@/lib/rbac";

const CopilotRequestSchema = z.object({
  organizationId: z.string().uuid(),
  question: z.string().min(3).max(500),
});

const COPILOT_RATE_LIMIT = 20;
const COPILOT_RATE_WINDOW_MS = 60_000;

export const POST = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  // Keyed by user, not IP — this is authenticated, and a shared office IP
  // shouldn't throttle every employee together.
  const rateLimit = checkRateLimit(`copilot:${userId}`, COPILOT_RATE_LIMIT, COPILOT_RATE_WINDOW_MS);
  if (!rateLimit.allowed) return apiError(429, "Too many questions — please try again shortly.");

  const input = CopilotRequestSchema.parse(await req.json());
  // Organization.Read is granted to every seeded role — this is a
  // membership check, not a capability check: any org member can ask.
  await requirePermission(userId, input.organizationId, "Organization.Read");

  const pool = getPool();
  const { rows: orgRows } = await pool.query(`SELECT name, type FROM organizations WHERE id = $1`, [
    input.organizationId,
  ]);
  if (orgRows.length === 0) return apiError(404, "Organization not found");
  const org = orgRows[0];
  const isNgo = org.type === "ngo";

  const { rows: projectRows } = await pool.query(
    `SELECT p.id, p.title, p.status, p.budget_amount, c.name AS category
       FROM csr_projects p
       JOIN csr_categories c ON c.id = p.csr_category_id
       LEFT JOIN ngo_profiles np ON np.id = p.ngo_profile_id
      WHERE p.deleted_at IS NULL AND ${isNgo ? "np.organization_id = $1" : "p.corporate_org_id = $1"}
      ORDER BY p.created_at DESC
      LIMIT 15`,
    [input.organizationId]
  );

  const { rows: policyRows } = await pool.query(
    `SELECT title, category, effective_date
       FROM governance_policies
      WHERE organization_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 10`,
    [input.organizationId]
  );

  let ngoProfile = null;
  if (isNgo) {
    const { rows } = await pool.query(
      `SELECT legal_name, operating_states,
              COALESCE(array_agg(c.name) FILTER (WHERE c.name IS NOT NULL), '{}') AS cause_areas
         FROM ngo_profiles np
         LEFT JOIN ngo_cause_areas nca ON nca.ngo_profile_id = np.id
         LEFT JOIN csr_categories c ON c.id = nca.csr_category_id
        WHERE np.organization_id = $1 AND np.deleted_at IS NULL
        GROUP BY np.id`,
      [input.organizationId]
    );
    if (rows[0]) {
      ngoProfile = {
        legalName: rows[0].legal_name,
        operatingStates: rows[0].operating_states,
        causeAreas: rows[0].cause_areas,
      };
    }
  }

  let cerebras;
  try {
    cerebras = getCerebrasClient();
  } catch {
    return apiError(503, "AI Copilot is not configured (missing CEREBRAS_API_KEY).");
  }

  const context = {
    organizationName: org.name as string,
    organizationType: org.type as string,
    projects: projectRows.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      budgetAmount: p.budget_amount ? Number(p.budget_amount) : null,
      category: p.category,
    })),
    ngoProfile,
    policies: policyRows.map((p) => ({
      title: p.title as string,
      category: p.category as string,
      effectiveDate: p.effective_date as string | null,
    })),
  };

  const completion = await cerebras.chat.completions.create({
    model: CEREBRAS_MODEL,
    messages: buildCopilotMessages(input.question, context),
    temperature: 0.2,
    max_tokens: 400,
  });

  const answer = completion.choices[0]?.message?.content ?? "I couldn't generate an answer just now.";

  // AI governance trail: every Copilot answer is logged with the model
  // version and question/answer, so "what did the AI say and on what model"
  // is auditable later — reuses the same audit_logs table the rest of the
  // platform's "who did what" trail lives in, rather than a separate store.
  await pool.query(
    `INSERT INTO audit_logs (organization_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'ai_copilot.answered', 'organization', $1, $2)`,
    [
      input.organizationId,
      JSON.stringify({
        model: CEREBRAS_MODEL,
        question: input.question,
        answer,
        groundedInProjectCount: context.projects.length,
      }),
    ]
  );

  return apiSuccess({
    answer,
    model: CEREBRAS_MODEL,
    groundedInProjectCount: context.projects.length,
  });
});
