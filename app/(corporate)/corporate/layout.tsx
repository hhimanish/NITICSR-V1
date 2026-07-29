import { DashboardShell } from "@/components/dashboard/shell";
import { corporateNav } from "@/components/dashboard/nav-data";

export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell portal="Corporate" navItems={corporateNav}>
      {children}
    </DashboardShell>
  );
}
