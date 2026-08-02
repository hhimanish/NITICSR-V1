import { getPool } from "@/lib/db";

/**
 * Continuous Controls Monitoring (ERT 8) — not a new detection engine, a
 * unification of checks that already individually exist scattered across
 * ERT 2 (compliance obligations), ERT 3 (NGO document expiry), ERT 5
 * (unspent-fund transfers), ERT 6 (change-request approvals), and ERT 7
 * (geofence violations), plus a few new deterministic ones. Every alert
 * here traces to a real row — nothing is predicted, scored, or estimated.
 * The two "anomaly" checks (disbursement outlier, geofence inconsistency)
 * are plain statistical ratios, explicitly not fraud-detection AI.
 */

export type ControlAlert = {
  type: string;
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
};

const DISBURSEMENT_OUTLIER_RATIO = 2.5;
const NGO_DOCUMENT_LOOKAHEAD_DAYS = 60;

export async function computeControlAlerts(organizationId: string): Promise<ControlAlert[]> {
  const pool = getPool();

  const [
    expiringDocs,
    geofenceViolations,
    overdueObligations,
    overdueTransfers,
    sodConflicts,
    duplicateBeneficiaries,
    overdueCapa,
    disbursementOutliers,
  ] = await Promise.all([
    pool.query(
      `SELECT DISTINCT np.legal_name, nd.document_type, nd.expires_at
         FROM csr_projects p
         JOIN ngo_profiles np ON np.id = p.ngo_profile_id
         JOIN ngo_documents nd ON nd.ngo_profile_id = np.id
        WHERE p.corporate_org_id = $1 AND p.deleted_at IS NULL
          AND nd.status = 'verified' AND nd.expires_at IS NOT NULL
          AND nd.expires_at <= (CURRENT_DATE + INTERVAL '${NGO_DOCUMENT_LOOKAHEAD_DAYS} days')
        LIMIT 20`,
      [organizationId]
    ),
    pool.query(
      `SELECT fv.id, p.title AS project_title, fv.created_at, fv.distance_km
         FROM field_visits fv JOIN csr_projects p ON p.id = fv.csr_project_id
        WHERE fv.organization_id = $1 AND fv.within_geofence = false
        ORDER BY fv.created_at DESC LIMIT 20`,
      [organizationId]
    ),
    pool.query(
      `SELECT co.id, p.title AS project_title, co.description, co.due_date
         FROM compliance_obligations co JOIN csr_projects p ON p.id = co.csr_project_id
        WHERE co.organization_id = $1 AND co.status = 'pending' AND co.due_date < CURRENT_DATE
        LIMIT 20`,
      [organizationId]
    ),
    pool.query(
      `SELECT uft.id, p.title AS project_title, uft.unspent_amount, uft.due_date
         FROM unspent_fund_transfers uft JOIN csr_projects p ON p.id = uft.csr_project_id
        WHERE uft.organization_id = $1 AND uft.status = 'pending' AND uft.due_date < CURRENT_DATE
        LIMIT 20`,
      [organizationId]
    ),
    pool.query(
      `SELECT cr.id, p.title AS project_title, cr.field, cr.decided_at
         FROM change_requests cr JOIN csr_projects p ON p.id = cr.csr_project_id
        WHERE p.corporate_org_id = $1 AND cr.status = 'approved' AND cr.requested_by = cr.decided_by
        LIMIT 20`,
      [organizationId]
    ),
    pool.query(
      `SELECT p.title AS project_title, b.category, COUNT(*) AS entry_count
         FROM beneficiaries b JOIN csr_projects p ON p.id = b.csr_project_id
        WHERE p.corporate_org_id = $1
        GROUP BY p.id, p.title, b.category
       HAVING COUNT(*) > 1
        LIMIT 20`,
      [organizationId]
    ),
    pool.query(
      `SELECT id, title, due_date FROM capa_items
        WHERE organization_id = $1 AND status != 'done' AND due_date IS NOT NULL AND due_date < CURRENT_DATE
        LIMIT 20`,
      [organizationId]
    ),
    pool.query(
      `WITH stats AS (
         SELECT d.id, d.amount, p.title AS project_title,
                AVG(d.amount) OVER (PARTITION BY d.csr_project_id) AS avg_amount,
                COUNT(*) OVER (PARTITION BY d.csr_project_id) AS n
           FROM disbursements d JOIN csr_projects p ON p.id = d.csr_project_id
          WHERE p.corporate_org_id = $1
       )
       SELECT id, project_title, amount, avg_amount FROM stats
        WHERE n >= 3 AND amount > avg_amount * ${DISBURSEMENT_OUTLIER_RATIO}
        LIMIT 20`,
      [organizationId]
    ),
  ]);

  const alerts: ControlAlert[] = [];

  for (const r of expiringDocs.rows) {
    alerts.push({
      type: "ngo_document_expiry",
      severity: "medium",
      title: `${r.legal_name}'s ${r.document_type} expires ${new Date(r.expires_at).toLocaleDateString("en-IN")}`,
      detail: "Verified NGO document nearing expiry.",
    });
  }
  for (const r of geofenceViolations.rows) {
    alerts.push({
      type: "geofence_violation",
      severity: "high",
      title: `Field visit outside site geofence — ${r.project_title}`,
      detail: `Recorded ${Number(r.distance_km).toFixed(1)}km from the registered project location on ${new Date(r.created_at).toLocaleDateString("en-IN")}.`,
    });
  }
  for (const r of overdueObligations.rows) {
    alerts.push({
      type: "overdue_compliance_obligation",
      severity: "high",
      title: `Overdue: ${r.description} — ${r.project_title}`,
      detail: `Due ${new Date(r.due_date).toLocaleDateString("en-IN")}.`,
    });
  }
  for (const r of overdueTransfers.rows) {
    alerts.push({
      type: "overdue_unspent_transfer",
      severity: "high",
      title: `Overdue unspent-fund transfer — ${r.project_title}`,
      detail: `₹${Number(r.unspent_amount).toLocaleString("en-IN")} was due ${new Date(r.due_date).toLocaleDateString("en-IN")}.`,
    });
  }
  for (const r of sodConflicts.rows) {
    alerts.push({
      type: "segregation_of_duty",
      severity: "high",
      title: `Same user requested and approved a change — ${r.project_title}`,
      detail: `Field: ${r.field}, decided ${new Date(r.decided_at).toLocaleDateString("en-IN")}.`,
    });
  }
  for (const r of duplicateBeneficiaries.rows) {
    alerts.push({
      type: "duplicate_beneficiary_entry",
      severity: "low",
      title: `Possible duplicate beneficiary entry — ${r.project_title}`,
      detail: `${r.entry_count} entries for category "${r.category}".`,
    });
  }
  for (const r of overdueCapa.rows) {
    alerts.push({
      type: "overdue_capa",
      severity: "medium",
      title: `Overdue corrective action: ${r.title}`,
      detail: `Was due ${new Date(r.due_date).toLocaleDateString("en-IN")}.`,
    });
  }
  for (const r of disbursementOutliers.rows) {
    alerts.push({
      type: "disbursement_outlier",
      severity: "medium",
      title: `Unusually large disbursement — ${r.project_title}`,
      detail: `₹${Number(r.amount).toLocaleString("en-IN")} vs. a project average of ₹${Number(r.avg_amount).toLocaleString("en-IN")} (a statistical ratio check, not fraud detection).`,
    });
  }

  return alerts;
}
