import type { Metadata } from "next";
import { ClipboardCheck, Eye, FileSearch, Lock, ScrollText, Timer } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

export const metadata: Metadata = {
  title: "Auditors",
  description: "Independent verification tooling for Schedule VII compliance review.",
  alternates: { canonical: "/solutions/auditors" },
  openGraph: {
    title: "Auditors — NITICSR",
    description: "Independent verification tooling for Schedule VII compliance review.",
    url: "/solutions/auditors",
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auditors — NITICSR",
    description: "Independent verification tooling for Schedule VII compliance review.",
  },
};

export default function AuditorSolutionPage() {
  return (
    <SolutionPage
      data={{
        breadcrumbs: [{ label: "Solutions", href: "/solutions/auditors" }, { label: "Auditors", href: "/solutions/auditors" }],
        eyebrow: "Solutions / Auditors",
        title: "Independent visibility into CSR spend and compliance",
        description:
          "Review CSR engagements, verification history, and spend records without depending on a corporate's internal reporting alone.",
        audience: [
          "Statutory and internal auditors reviewing CSR-2 disclosures",
          "Independent compliance consultants engaged for CSR audits",
          "Board audit committees seeking third-party assurance",
          "Regulatory and grant compliance reviewers",
        ],
        capabilities: [
          { icon: Eye, title: "Independent access", description: "Review records with a dedicated auditor view, without full corporate or NGO account permissions." },
          { icon: FileSearch, title: "Verification trail", description: "See exactly what checks a partner passed, and when, before funds were routed." },
          { icon: ScrollText, title: "Structured disclosures", description: "Records organized around what a Schedule VII compliance review actually asks for." },
          { icon: ClipboardCheck, title: "Consistent methodology", description: "Every engagement is documented the same way, making cross-partner review faster." },
          { icon: Lock, title: "Tamper-evident history", description: "Engagement and verification records are not editable after the fact." },
          { icon: Timer, title: "Faster review cycles", description: "Spend less time chasing documentation and more time on substantive review." },
        ],
      }}
    />
  );
}
