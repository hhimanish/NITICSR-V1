import type { Metadata } from "next";
import { BrainCircuit, FileCheck2, LayoutDashboard, ShieldCheck, Sparkles, Workflow } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

export const metadata: Metadata = {
  title: "Platform",
  description: "One operating system for CSR discovery, verification, and compliance.",
};

export default function PlatformPage() {
  return (
    <SolutionPage
      data={{
        breadcrumbs: [{ label: "Platform", href: "/platform" }],
        eyebrow: "Platform",
        title: "One operating system for your entire CSR program",
        description:
          "NITICSR brings NGO discovery, verification, and Schedule VII compliance reporting into a single workspace — instead of spreadsheets, email threads, and manual due diligence.",
        audience: [
          "Corporate CSR teams managing multiple NGO partnerships",
          "Compliance and legal teams responsible for Schedule VII reporting",
          "NGOs seeking visibility to verified corporate CSR budgets",
          "Independent auditors reviewing CSR spend and impact",
        ],
        capabilities: [
          {
            icon: BrainCircuit,
            title: "AI-matched discovery",
            description: "Rank NGO partners by cause alignment, geography fit, and budget band in seconds.",
          },
          {
            icon: ShieldCheck,
            title: "Verification Vault",
            description: "Registration, financial, and statutory checks before a partner ever surfaces in a match.",
          },
          {
            icon: FileCheck2,
            title: "Audit-ready records",
            description: "Every engagement keeps documentation compliance teams can hand to an auditor as-is.",
          },
          {
            icon: LayoutDashboard,
            title: "Unified dashboard",
            description: "Track discovery, verification, and reporting status across every partnership in one view.",
          },
          {
            icon: Workflow,
            title: "Structured workflows",
            description: "Guided steps from first match to signed engagement, so nothing falls through the cracks.",
          },
          {
            icon: Sparkles,
            title: "Built to expand",
            description: "Phase 1 ships discovery and compliance skeleton today; escrow and audit tooling follow.",
          },
        ],
      }}
    />
  );
}
