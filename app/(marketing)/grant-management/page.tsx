import type { Metadata } from "next";
import { ClipboardCheck, FileSignature, Landmark, RefreshCw, ScrollText, Wallet } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

const TITLE = "Grant Management OS";
const DESCRIPTION =
  "The full grant lifecycle — proposal, review, agreement, disbursement, and renewal — in one system of record, not a spreadsheet and an email thread.";
const URL = "/grant-management";

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

export default function GrantManagementPage() {
  return (
    <SolutionPage
      data={{
        breadcrumbs: [{ label: "Solutions", href: URL }, { label: "Grant Management", href: URL }],
        eyebrow: "Grant Management",
        title: "From proposal to renewal, one record instead of five spreadsheets",
        description:
          "Every stage of a grant's life — readiness, review, agreement, disbursement, closure, renewal — lives in the same system as the project itself, not a parallel process nobody keeps in sync.",
        audience: [
          "CSR managers running a multi-NGO grant portfolio",
          "Finance teams tracking fund utilization against budget",
          "Company secretaries who need CSR-2 utilization records ready, not reconstructed",
          "NGOs who need one place to see and acknowledge grant terms",
        ],
        capabilities: [
          {
            icon: ClipboardCheck,
            title: "Proposal readiness, scored honestly",
            description:
              "A readiness score blended only from real signals — data completeness and the partner NGO's own verification history — never a fabricated rating.",
          },
          {
            icon: ScrollText,
            title: "Structured review notes",
            description: "Replace the email thread with a real, timestamped record of who reviewed a proposal and what they recommended.",
          },
          {
            icon: FileSignature,
            title: "Grant agreements, acknowledged",
            description: "Terms the NGO explicitly acknowledges — editing them after the fact clears the acknowledgement, so it never goes stale.",
          },
          {
            icon: Wallet,
            title: "Fund utilization ledger",
            description: "Every disbursement recorded against budget in real time — the same data your CSR-2 filing needs, generated as you work.",
          },
          {
            icon: Landmark,
            title: "One lifecycle, not a portal per stage",
            description: "Proposal, approval, agreement, disbursement, and compliance obligations all live on the same project record.",
          },
          {
            icon: RefreshCw,
            title: "Renewal, linked to history",
            description: "Renewing a completed grant creates a new record linked to its predecessor — the relationship is never lost.",
          },
        ],
      }}
    />
  );
}
