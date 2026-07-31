import type { Metadata } from "next";
import { Globe2, Leaf, LineChart, Recycle, Target, TreePine } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

export const metadata: Metadata = {
  title: "ESG & Sustainability",
  description: "Track SDG alignment and environmental impact alongside CSR compliance.",
};

export default function EsgPage() {
  return (
    <SolutionPage
      data={{
        eyebrow: "ESG & Sustainability",
        title: "ESG reporting, grounded in real project data",
        description:
          "CSR and ESG shouldn't live in separate spreadsheets. NITICSR ties every project to its SDG alignment automatically, so sustainability reporting draws from the same system of record as compliance.",
        audience: [
          "Sustainability and ESG teams reporting alongside CSR",
          "Corporates aligning CSR spend to SDG commitments",
          "Investor relations teams preparing ESG disclosures",
          "Boards tracking sustainability alongside compliance",
        ],
        capabilities: [
          { icon: Target, title: "Automatic SDG mapping", description: "Every CSR project tags its relevant SDGs — no manual reclassification at reporting time." },
          { icon: Leaf, title: "Environment-focused causes", description: "Filter and match on environment & sustainability as a first-class Schedule VII category." },
          { icon: LineChart, title: "Portfolio-level view", description: "See SDG coverage and gaps across your entire CSR portfolio, not project-by-project." },
          { icon: TreePine, title: "Impact, not just spend", description: "Track beneficiary and outcome data alongside budget, so ESG reporting isn't spend-only." },
          { icon: Recycle, title: "Consistent methodology", description: "The same project record structure powers both compliance and sustainability reporting." },
          { icon: Globe2, title: "Built for scale", description: "Designed to support multi-entity ESG reporting as your CSR program grows." },
        ],
      }}
    />
  );
}
