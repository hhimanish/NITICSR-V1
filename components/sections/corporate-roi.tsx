import { Check, X } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";

const rows = [
  {
    dimension: "NGO due diligence",
    before: "Weeks of manual verification per partner",
    after: "Pre-verified shortlist in minutes",
  },
  {
    dimension: "Compliance risk",
    before: "Documentation reconstructed at year-end",
    after: "Audit-ready records from day one",
  },
  {
    dimension: "Fund governance",
    before: "Spend tracked across spreadsheets and email",
    after: "One system of record for every rupee routed",
  },
  {
    dimension: "ESG reporting",
    before: "Manual SDG mapping for disclosures",
    after: "SDG alignment tracked per project automatically",
  },
  {
    dimension: "Board reporting",
    before: "Ad hoc slide decks assembled each quarter",
    after: "Standing dashboard, board-ready on demand",
  },
];

export function CorporateRoi() {
  return (
    <section className="border-b border-border bg-background py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            What changes for your CSR team
          </h2>
          <p className="mt-4 text-muted-foreground">Illustrative comparison — outcomes vary by organization.</p>
        </FadeIn>

        <StaggerGroup className="mt-12 overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-[1fr_1.4fr_1.4fr] sm:divide-y-0">
            <div className="hidden bg-card p-4 text-sm font-semibold sm:block" />
            <div className="hidden bg-card p-4 text-sm font-semibold text-muted-foreground sm:block">
              Without NITICSR
            </div>
            <div className="hidden bg-card p-4 text-sm font-semibold text-secondary sm:block">With NITICSR</div>
          </div>
          {rows.map((row) => (
            <StaggerItem key={row.dimension} className="border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_1.4fr]">
                <div className="bg-card p-4 text-sm font-semibold sm:bg-transparent">{row.dimension}</div>
                <div className="flex items-start gap-2 p-4 text-sm text-muted-foreground">
                  <X className="mt-0.5 size-4 shrink-0 text-destructive/70" aria-hidden="true" />
                  {row.before}
                </div>
                <div className="flex items-start gap-2 border-t border-border p-4 text-sm sm:border-t-0 sm:border-l">
                  <Check className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
                  {row.after}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
