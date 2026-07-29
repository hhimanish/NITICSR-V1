import { ShieldCheck } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";

export default function NgoVerificationPage() {
  return (
    <DashboardEmptyState
      icon={ShieldCheck}
      title="Verification"
      description="Document upload, registration checks, and verification status tracking are coming in Phase 2."
    />
  );
}
