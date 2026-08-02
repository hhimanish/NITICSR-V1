import { getPool } from "@/lib/db";

/**
 * Financial Operations (ERT 5) — an organization's declared annual CSR
 * budget, the Section 135(5)/(6) unspent-fund transfer obligation, and
 * expense categorization on the existing disbursement ledger (ERT 4).
 * Every number here is derived from real budget/disbursement data already
 * in the system — no payments/escrow execution, no GL integration, no
 * fabricated forecast model.
 */

const MS_PER_DAY = 86_400_000;

/** Indian fiscal year: April 1 – March 31, labeled e.g. "2025-26". */
export function getFiscalYearLabel(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0 = Jan
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export function getFiscalYearEnd(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const endYear = month >= 3 ? year + 1 : year;
  return new Date(Date.UTC(endYear, 2, 31)); // March = month index 2
}

/** Parses a "YYYY-YY" label back into its calendar date range. */
export function parseFiscalYearRange(fiscalYear: string): { start: Date; end: Date } {
  const [startYearStr] = fiscalYear.split("-");
  const startYear = Number(startYearStr);
  return {
    start: new Date(Date.UTC(startYear, 3, 1)),
    end: new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59)),
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

/** Called when a project completes. Computes real unspent budget (budget
 * minus what's actually been disbursed) and, if any remains, records the
 * statutory transfer obligation — an "Unspent CSR Account" transfer within
 * 30 days of fiscal year end for an ongoing project, or a Schedule VII fund
 * transfer within 6 months for any other project. Idempotent: does nothing
 * if a transfer record already exists for this project, or if nothing is
 * unspent. */
export async function generateUnspentFundTransferIfNeeded(
  csrProjectId: string,
  organizationId: string,
  isOngoingProject: boolean,
  budgetAmount: number | null,
  completedAt: Date
) {
  if (!budgetAmount) return null;

  const pool = getPool();
  const { rows: disbursedRows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM disbursements WHERE csr_project_id = $1`,
    [csrProjectId]
  );
  const unspentAmount = budgetAmount - Number(disbursedRows[0].total);
  if (unspentAmount <= 0) return null;

  const fiscalYearEnd = getFiscalYearEnd(completedAt);
  const destination = isOngoingProject ? "unspent_csr_account" : "schedule_vii_fund";
  const dueDate = destination === "unspent_csr_account" ? addDays(fiscalYearEnd, 30) : addMonths(fiscalYearEnd, 6);

  const { rows } = await pool.query(
    `INSERT INTO unspent_fund_transfers
       (organization_id, csr_project_id, unspent_amount, destination, due_date)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (csr_project_id) DO NOTHING
     RETURNING id, unspent_amount, destination, due_date, status`,
    [organizationId, csrProjectId, unspentAmount, destination, dueDate.toISOString().slice(0, 10)]
  );
  return rows[0] ?? null;
}

export type FundUtilization = {
  fiscalYear: string;
  annualBudget: number | null;
  disbursedInFiscalYear: number;
  totalAllocatedAcrossProjects: number;
  totalDisbursedAllTime: number;
  pendingUnspentTransfers: { count: number; totalAmount: number };
};

export async function computeOrgFundUtilization(
  organizationId: string,
  fiscalYear: string
): Promise<FundUtilization> {
  const pool = getPool();
  const { start, end } = parseFiscalYearRange(fiscalYear);

  const [{ rows: budgetRows }, { rows: fyDisbursedRows }, { rows: allocatedRows }, { rows: allTimeRows }, { rows: pendingRows }] =
    await Promise.all([
      pool.query(`SELECT budget_amount FROM annual_csr_budgets WHERE organization_id = $1 AND fiscal_year = $2`, [
        organizationId,
        fiscalYear,
      ]),
      pool.query(
        `SELECT COALESCE(SUM(d.amount), 0) AS total
           FROM disbursements d
           JOIN csr_projects p ON p.id = d.csr_project_id
          WHERE p.corporate_org_id = $1 AND d.created_at BETWEEN $2 AND $3`,
        [organizationId, start.toISOString(), end.toISOString()]
      ),
      pool.query(
        `SELECT COALESCE(SUM(budget_amount), 0) AS total FROM csr_projects
          WHERE corporate_org_id = $1 AND deleted_at IS NULL AND status IN ('approved', 'active', 'completed')`,
        [organizationId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(d.amount), 0) AS total
           FROM disbursements d
           JOIN csr_projects p ON p.id = d.csr_project_id
          WHERE p.corporate_org_id = $1`,
        [organizationId]
      ),
      pool.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(unspent_amount), 0) AS total
           FROM unspent_fund_transfers WHERE organization_id = $1 AND status = 'pending'`,
        [organizationId]
      ),
    ]);

  return {
    fiscalYear,
    annualBudget: budgetRows[0] ? Number(budgetRows[0].budget_amount) : null,
    disbursedInFiscalYear: Number(fyDisbursedRows[0].total),
    totalAllocatedAcrossProjects: Number(allocatedRows[0].total),
    totalDisbursedAllTime: Number(allTimeRows[0].total),
    pendingUnspentTransfers: {
      count: Number(pendingRows[0].count),
      totalAmount: Number(pendingRows[0].total),
    },
  };
}

export type DisbursementForecast = {
  remainingBudget: number;
  dailyRate: number;
  projectedExhaustionDate: string | null;
  exhausted: boolean;
} | null;

/** An honest linear projection from real disbursement history — not a
 * fabricated model. Returns null with too little history (fewer than 2
 * disbursements) to extrapolate a rate from. */
export async function computeDisbursementForecast(
  csrProjectId: string,
  budgetAmount: number | null
): Promise<DisbursementForecast> {
  if (!budgetAmount) return null;

  const { rows } = await getPool().query(
    `SELECT amount, created_at FROM disbursements WHERE csr_project_id = $1 ORDER BY created_at ASC`,
    [csrProjectId]
  );
  if (rows.length < 2) return null;

  const totalDisbursed = rows.reduce((sum, r) => sum + Number(r.amount), 0);
  const firstDate = new Date(rows[0].created_at);
  const daysElapsed = (Date.now() - firstDate.getTime()) / MS_PER_DAY;
  if (daysElapsed <= 0) return null;

  const dailyRate = totalDisbursed / daysElapsed;
  const remainingBudget = budgetAmount - totalDisbursed;

  if (remainingBudget <= 0) {
    return { remainingBudget, dailyRate, projectedExhaustionDate: null, exhausted: true };
  }
  if (dailyRate <= 0) {
    return { remainingBudget, dailyRate, projectedExhaustionDate: null, exhausted: false };
  }

  const daysToExhaust = remainingBudget / dailyRate;
  const projectedDate = new Date(Date.now() + daysToExhaust * MS_PER_DAY);
  return {
    remainingBudget,
    dailyRate,
    projectedExhaustionDate: projectedDate.toISOString().slice(0, 10),
    exhausted: false,
  };
}
