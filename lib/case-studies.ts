export type CaseStudy = {
  slug: string;
  title: string;
  excerpt: string;
  sector: string;
  metric: string;
};

/** Illustrative — see the "Illustrative example" labeling on each case
 * study page. There are no real named customers to draw from yet; these
 * model the kind of outcome the platform is designed to produce. */
export const caseStudies: CaseStudy[] = [
  {
    slug: "manufacturing-conglomerate-discovery-time",
    title: "Cutting NGO due-diligence time from weeks to hours",
    excerpt:
      "An illustrative manufacturing conglomerate consolidates NGO discovery and verification into one workflow.",
    sector: "Manufacturing",
    metric: "Illustrative: 3 weeks → 1 day",
  },
  {
    slug: "fmcg-schedule-vii-reporting",
    title: "Making Schedule VII reporting a byproduct of the work",
    excerpt:
      "An illustrative FMCG CSR team restructures documentation around what a CSR-2 disclosure actually needs.",
    sector: "FMCG",
    metric: "Illustrative: audit-ready records from day one",
  },
];
