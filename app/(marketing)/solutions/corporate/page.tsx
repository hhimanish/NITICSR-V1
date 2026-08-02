import type { Metadata } from "next";
import { BadgeCheck, LineChart, Search, ShieldCheck, Timer, Users } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

export const metadata: Metadata = {
  title: "Corporate CSR",
  description: "Discover, verify, and fund NGO partners without the compliance guesswork.",
  alternates: { canonical: "/solutions/corporate" },
  openGraph: {
    title: "Corporate CSR — NITICSR",
    description: "Discover, verify, and fund NGO partners without the compliance guesswork.",
    url: "/solutions/corporate",
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Corporate CSR — NITICSR",
    description: "Discover, verify, and fund NGO partners without the compliance guesswork.",
  },
};

export default function CorporateSolutionPage() {
  return (
    <SolutionPage
      data={{
        breadcrumbs: [{ label: "Solutions", href: "/solutions/corporate" }, { label: "Corporate CSR", href: "/solutions/corporate" }],
        eyebrow: "Solutions / Corporate CSR",
        title: "CSR budget, matched to verified impact",
        description:
          "Stop choosing NGO partners off cold outreach and word of mouth. Get a ranked shortlist backed by verification, with reporting built in from day one.",
        audience: [
          "CSR heads at companies crossing the Section 135 applicability threshold",
          "Compliance officers preparing CSR-2 disclosures",
          "CFO/finance teams tracking unspent CSR obligations",
          "Boards seeking defensible, auditable CSR spend",
        ],
        capabilities: [
          { icon: Search, title: "Guided discovery", description: "Filter by Schedule VII cause area, state, and budget band to get a ranked NGO shortlist." },
          { icon: ShieldCheck, title: "Pre-verified partners", description: "Every recommended NGO has passed registration and statutory checks before you see it." },
          { icon: LineChart, title: "Portfolio visibility", description: "See spend, cause coverage, and geography spread across every active partnership." },
          { icon: BadgeCheck, title: "Compliance-first records", description: "Documentation structured around what a Schedule VII disclosure actually requires." },
          { icon: Timer, title: "Faster onboarding", description: "Cut weeks of manual due diligence down to a single review session." },
          { icon: Users, title: "Built for teams", description: "Shared visibility for CSR, compliance, and finance stakeholders in one workspace." },
        ],
      }}
    />
  );
}
