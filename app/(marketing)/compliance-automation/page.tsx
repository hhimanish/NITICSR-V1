import type { Metadata } from "next";
import { AlarmClock, FileCheck2, FileClock, ListChecks, ShieldAlert, Workflow } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

export const metadata: Metadata = {
  title: "Compliance Automation",
  description: "Schedule VII compliance workflows that generate their own documentation.",
};

export default function ComplianceAutomationPage() {
  return (
    <SolutionPage
      data={{
        eyebrow: "Compliance Automation",
        title: "Compliance that documents itself as you work",
        description:
          "Instead of reconstructing records at year-end, NITICSR structures every step of the CSR lifecycle around what a Schedule VII disclosure actually requires.",
        audience: [
          "Company secretaries preparing CSR-2 disclosures",
          "Compliance officers tracking unspent CSR obligations",
          "CFO/finance teams monitoring fund transfer deadlines",
          "Legal teams reviewing CSR governance",
        ],
        capabilities: [
          { icon: ListChecks, title: "Structured records", description: "Every engagement captures what a CSR-2 filing needs, from day one — not assembled retroactively." },
          { icon: AlarmClock, title: "Renewal & deadline tracking", description: "Document expiry and unspent-fund transfer windows are tracked automatically, not on a spreadsheet." },
          { icon: FileClock, title: "Ongoing vs. one-time project logic", description: "Unspent amounts are handled per the rules that actually apply to each project type." },
          { icon: ShieldAlert, title: "Early risk flags", description: "Surfaces gaps — an expiring FCRA registration, a stalled milestone — before they become a filing problem." },
          { icon: Workflow, title: "One workflow, not many tools", description: "Discovery, verification, and reporting live in the same system, so nothing falls through the cracks." },
          { icon: FileCheck2, title: "Audit-ready by default", description: "Records are structured so an auditor or company secretary can review them as-is." },
        ],
      }}
    />
  );
}
