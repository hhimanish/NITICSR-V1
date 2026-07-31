import { DashboardShell } from "@/components/dashboard/shell";
import { OrgProvider } from "@/components/dashboard/org-context";
import { auditorNav } from "@/components/dashboard/nav-data";

export default function AuditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider type="auditor" typeLabel="Auditor">
      <DashboardShell portal="Auditor" navItems={auditorNav}>
        {children}
      </DashboardShell>
    </OrgProvider>
  );
}
