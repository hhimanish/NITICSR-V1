export type CsrProjectStatus = "draft" | "proposed" | "approved" | "active" | "completed" | "cancelled";

/**
 * Real state machine for CSR project status. Found missing during a manual
 * QA pass (21 Aug 2026, NITICSR-PROJ-003): the status field previously
 * accepted any value the client sent, so a brand-new draft project could be
 * set straight to "completed" in one PATCH, with no NGO, no approval, and
 * 0% compliance behind it. Terminal states (completed, cancelled) have no
 * further transitions; every other state can also move to cancelled.
 */
const ALLOWED_TRANSITIONS: Record<CsrProjectStatus, CsrProjectStatus[]> = {
  draft: ["proposed", "cancelled"],
  proposed: ["draft", "approved", "cancelled"],
  approved: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isValidStatusTransition(from: CsrProjectStatus, to: CsrProjectStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
