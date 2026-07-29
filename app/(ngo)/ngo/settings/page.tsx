import { Settings } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";

export default function NgoSettingsPage() {
  return (
    <DashboardEmptyState
      icon={Settings}
      title="Settings"
      description="Organization profile, team members, and notification preferences are coming in Phase 2."
    />
  );
}
