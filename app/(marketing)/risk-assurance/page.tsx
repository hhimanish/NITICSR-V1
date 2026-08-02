import type { Metadata } from "next";
import { AlertTriangle, ClipboardCheck, ListChecks, ShieldAlert, Siren } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

const TITLE = "Risk, Audit & Assurance";
const DESCRIPTION =
  "A continuous controls feed that unifies the checks your CSR platform already runs — compliance deadlines, geofence violations, segregation-of-duty conflicts — plus a real risk register, controls library, and audit/CAPA workflow.";
const URL = "/risk-assurance";

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

export default function RiskAssurancePage() {
  return (
    <SolutionPage
      data={{
        breadcrumbs: [{ label: "Solutions", href: URL }, { label: "Risk, Audit & Assurance", href: URL }],
        eyebrow: "Risk, Audit & Assurance",
        title: "Every alert traces to a real record, not a predicted one",
        description:
          "Compliance deadlines, geofence violations, segregation-of-duty conflicts, and disbursement outliers — checks that already run individually across your CSR platform, unified into one continuous controls feed alongside a real risk register, controls library, and audit/CAPA workflow.",
        audience: [
          "Chief Risk Officers who need one view instead of five spreadsheets",
          "Internal audit teams running engagements and tracking corrective actions",
          "Compliance officers watching for segregation-of-duty and control gaps",
          "CSR leaders who want incidents logged and root-caused, not just remembered",
        ],
        capabilities: [
          {
            icon: AlertTriangle,
            title: "Continuous controls monitoring",
            description: "One feed unifying compliance, geofence, obligation, and approval checks — computed fresh, never stale.",
          },
          {
            icon: ShieldAlert,
            title: "Risk register",
            description: "Organization-wide or project-scoped risks and issues, tracked through open, mitigated, and closed.",
          },
          {
            icon: ListChecks,
            title: "Controls library",
            description: "A real catalog of preventive, detective, and corrective controls — not a fabricated maturity score.",
          },
          {
            icon: ClipboardCheck,
            title: "Audit engagements & CAPA",
            description: "Plan an engagement, track corrective actions to a due date, and close them out.",
          },
          {
            icon: Siren,
            title: "Incident log with root cause",
            description: "Log an incident with severity and a structured Five Whys — no diagramming tools required to start.",
          },
        ],
      }}
    />
  );
}
