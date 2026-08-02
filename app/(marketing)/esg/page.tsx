import type { Metadata } from "next";
import { FileText, Leaf, LineChart, Target, Users } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

const TITLE = "ESG & Sustainability";
const DESCRIPTION =
  "A real SDG rollup, social impact summary, and indicative BRSR principle cross-reference — computed from your actual project data, with no fabricated Sustainability Score or ESG Maturity Index.";
const URL = "/esg";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: `${TITLE} — NITICSR`,
    description: DESCRIPTION,
    url: URL,
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} — NITICSR`,
    description: DESCRIPTION,
  },
};

export default function EsgPage() {
  return (
    <SolutionPage
      data={{
        breadcrumbs: [{ label: "Solutions", href: URL }, { label: "ESG & Sustainability", href: URL }],
        eyebrow: "ESG & Sustainability",
        title: "Sustainability reporting that only claims what's actually measured",
        description:
          "CSR and ESG shouldn't live in separate spreadsheets. NITICSR ties every project to its SDG alignment and beneficiary data automatically — and is deliberately honest about what it doesn't measure: no carbon, water, or waste figures are shown, because none of that data has ever been captured.",
        audience: [
          "Sustainability and ESG teams reporting alongside CSR",
          "Corporates aligning CSR spend to SDG commitments",
          "Company secretaries preparing BRSR-adjacent disclosures",
          "Boards tracking sustainability alongside compliance and risk",
        ],
        capabilities: [
          { icon: Target, title: "Automatic SDG mapping", description: "Every CSR project tags its relevant SDGs — no manual reclassification at reporting time." },
          { icon: LineChart, title: "Real SDG rollup", description: "Project count, budget, and beneficiary totals per goal, aggregated across your whole portfolio." },
          { icon: Users, title: "Social impact summary", description: "Real beneficiary totals by category — not a spend-only view of CSR." },
          { icon: FileText, title: "BRSR principle cross-reference", description: "An indicative mapping from Schedule VII categories to SEBI's 9 NGRBC principles, for disclosure prep." },
          { icon: FileText, title: "Printable impact summary", description: "One honest export combining SDG, beneficiary, and compliance data — never presented as a certified filing." },
          { icon: Leaf, title: "No fabricated composite score", description: "No carbon, water, waste, or maturity index — those need real data this platform hasn't collected." },
        ],
      }}
    />
  );
}
