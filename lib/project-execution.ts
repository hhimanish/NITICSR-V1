import { getPool } from "@/lib/db";

/**
 * Project Execution (ERT 6) — finishes the `milestones` table that's sat
 * with no CRUD API since Phase 2, then extends it with tasks, dependencies,
 * a project-scoped risk/issue log, and change requests. The timeline here
 * is a real visualization computed from actual due dates, not a scheduling
 * engine; the portfolio rollup is real aggregation, not a fabricated index.
 */

export type MilestoneTimelineEntry = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  positionPercent: number | null;
};

/** Positions each milestone along a 0-100 scale between the project's
 * start and end date (falling back to the earliest/latest milestone due
 * date if the project itself has no explicit start/end). Milestones
 * without a due date get position null and are rendered separately by
 * the caller, not guessed at. */
export function computeMilestoneTimeline(
  projectStartDate: string | null,
  projectEndDate: string | null,
  milestones: { id: string; title: string; status: string; due_date: string | null }[]
): MilestoneTimelineEntry[] {
  const dated = milestones.filter((m) => m.due_date);
  let rangeStart = projectStartDate ? new Date(projectStartDate).getTime() : null;
  let rangeEnd = projectEndDate ? new Date(projectEndDate).getTime() : null;

  if ((rangeStart === null || rangeEnd === null) && dated.length > 0) {
    const times = dated.map((m) => new Date(m.due_date!).getTime());
    rangeStart = rangeStart ?? Math.min(...times);
    rangeEnd = rangeEnd ?? Math.max(...times);
  }

  return milestones.map((m) => {
    if (!m.due_date || rangeStart === null || rangeEnd === null || rangeEnd <= rangeStart) {
      return { id: m.id, title: m.title, status: m.status, dueDate: m.due_date, positionPercent: null };
    }
    const dueTime = new Date(m.due_date).getTime();
    const clamped = Math.min(rangeEnd, Math.max(rangeStart, dueTime));
    const positionPercent = Math.round(((clamped - rangeStart) / (rangeEnd - rangeStart)) * 100);
    return { id: m.id, title: m.title, status: m.status, dueDate: m.due_date, positionPercent };
  });
}

/** Rejects a dependency that would create a cycle — walks the existing
 * dependency graph within the project to check whether the target
 * milestone already (transitively) depends on the source. */
export async function wouldCreateDependencyCycle(
  milestoneId: string,
  dependsOnMilestoneId: string
): Promise<boolean> {
  if (milestoneId === dependsOnMilestoneId) return true;

  const pool = getPool();
  const visited = new Set<string>();
  let frontier = [dependsOnMilestoneId];

  while (frontier.length > 0) {
    const { rows } = await pool.query(
      `SELECT depends_on_milestone_id FROM milestone_dependencies WHERE milestone_id = ANY($1::uuid[])`,
      [frontier]
    );
    const next: string[] = [];
    for (const row of rows) {
      const id = row.depends_on_milestone_id as string;
      if (id === milestoneId) return true;
      if (!visited.has(id)) {
        visited.add(id);
        next.push(id);
      }
    }
    frontier = next;
  }
  return false;
}

export type PortfolioRollup = {
  totalPrograms: number;
  totalProjects: number;
  projectsByStatus: Record<string, number>;
  budgetByStatus: Record<string, number>;
  programs: { id: string; name: string; projectCount: number; totalBudget: number }[];
};

export async function computePortfolioRollup(organizationId: string): Promise<PortfolioRollup> {
  const pool = getPool();

  const [{ rows: projectRows }, { rows: programRows }] = await Promise.all([
    pool.query(
      `SELECT id, status, budget_amount, program_id FROM csr_projects
        WHERE corporate_org_id = $1 AND deleted_at IS NULL`,
      [organizationId]
    ),
    pool.query(`SELECT id, name FROM programs WHERE organization_id = $1 ORDER BY name`, [organizationId]),
  ]);

  const projectsByStatus: Record<string, number> = {};
  const budgetByStatus: Record<string, number> = {};
  const byProgram = new Map<string, { count: number; budget: number }>();

  for (const p of projectRows) {
    projectsByStatus[p.status] = (projectsByStatus[p.status] ?? 0) + 1;
    const amount = p.budget_amount ? Number(p.budget_amount) : 0;
    budgetByStatus[p.status] = (budgetByStatus[p.status] ?? 0) + amount;
    if (p.program_id) {
      const entry = byProgram.get(p.program_id) ?? { count: 0, budget: 0 };
      entry.count += 1;
      entry.budget += amount;
      byProgram.set(p.program_id, entry);
    }
  }

  return {
    totalPrograms: programRows.length,
    totalProjects: projectRows.length,
    projectsByStatus,
    budgetByStatus,
    programs: programRows.map((prog) => ({
      id: prog.id,
      name: prog.name,
      projectCount: byProgram.get(prog.id)?.count ?? 0,
      totalBudget: byProgram.get(prog.id)?.budget ?? 0,
    })),
  };
}
