import type { Metadata } from "next";
import { AlarmClock, Calculator, Landmark, LineChart, ReceiptText, Wallet } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

const TITLE = "Financial Operations";
const DESCRIPTION =
  "Annual CSR budget, fund utilization, and Section 135(5)/(6) unspent-fund transfers — computed from the same records as your projects, not a separate spreadsheet.";
const URL = "/financial-operations";

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

export default function FinancialOperationsPage() {
  return (
    <SolutionPage
      data={{
        breadcrumbs: [{ label: "Solutions", href: URL }, { label: "Financial Operations", href: URL }],
        eyebrow: "Financial Operations",
        title: "The unspent-fund rule, handled without a spreadsheet",
        description:
          "Section 135(5)/(6) requires unspent CSR amounts to move to the right account within a strict deadline — 30 days for an ongoing project, 6 months for any other. NITICSR generates that obligation automatically from your real project budgets and disbursements.",
        audience: [
          "Finance teams tracking CSR fund utilization against the annual budget",
          "Company secretaries managing the unspent-fund transfer deadline",
          "CSR managers who need spend categorized by vendor without an AP system",
          "Auditors reviewing fund utilization ahead of a CSR-2 filing",
        ],
        capabilities: [
          {
            icon: Landmark,
            title: "Annual CSR budget",
            description: "The company's declared obligation for the fiscal year, tracked against real disbursements across every project.",
          },
          {
            icon: AlarmClock,
            title: "Unspent-fund transfers, generated automatically",
            description: "The Section 135(5)/(6) rule applied the moment a project completes — no year-end reconstruction.",
          },
          {
            icon: Wallet,
            title: "Fund utilization dashboard",
            description: "Annual budget vs. allocated vs. disbursed, in one view, updated as disbursements are recorded.",
          },
          {
            icon: ReceiptText,
            title: "Expense categorization",
            description: "Vendor, category, and invoice reference on every disbursement — audit-ready without a document upload system.",
          },
          {
            icon: LineChart,
            title: "Disbursement pace forecast",
            description: "An honest projection from real disbursement history — never a fabricated model.",
          },
          {
            icon: Calculator,
            title: "One ledger, not a reconciliation exercise",
            description: "The same disbursement records feed compliance obligations, grant management, and financial reporting.",
          },
        ],
      }}
    />
  );
}
