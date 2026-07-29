import { DashboardShell } from "@/components/dashboard/shell";
import { ngoNav } from "@/components/dashboard/nav-data";

export default function NgoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell portal="NGO" navItems={ngoNav}>
      {children}
    </DashboardShell>
  );
}
