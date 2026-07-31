import { DashboardShell } from "@/components/dashboard/shell";
import { OrgProvider } from "@/components/dashboard/org-context";
import { ngoNav } from "@/components/dashboard/nav-data";

export default function NgoLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider type="ngo" typeLabel="NGO">
      <DashboardShell portal="NGO" navItems={ngoNav}>
        {children}
      </DashboardShell>
    </OrgProvider>
  );
}
