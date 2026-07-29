import { Search } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";

export default function CorporateDiscoveryPage() {
  return (
    <DashboardEmptyState
      icon={Search}
      title="NGO Discovery"
      description="Full in-dashboard AI matchmaking, saved shortlists, and outreach tools are coming in Phase 2. Try the public demo on the homepage in the meantime."
    />
  );
}
