import { Search } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";

export default function NgoMatchesPage() {
  return (
    <DashboardEmptyState
      icon={Search}
      title="Corporate Matches"
      description="A full inbox of corporate CSR matches, budget bands, and outreach tools is coming in Phase 2."
    />
  );
}
