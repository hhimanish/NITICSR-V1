import { DashboardShell } from "@/components/dashboard/shell";
import { OrgProvider } from "@/components/dashboard/org-context";
import { corporateNav } from "@/components/dashboard/nav-data";

export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider type="corporate" typeLabel="Corporate">
      <DashboardShell portal="Corporate" navItems={corporateNav}>
        {children}
      </DashboardShell>
    </OrgProvider>
  );
}
