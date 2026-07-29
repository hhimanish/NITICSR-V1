import { ShieldCheck } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";

export default function CorporateCompliancePage() {
  return (
    <DashboardEmptyState
      icon={ShieldCheck}
      title="Compliance"
      description="Schedule VII compliance tracking, unspent-fund monitoring, and audit-ready reporting are coming in Phase 2."
    />
  );
}
