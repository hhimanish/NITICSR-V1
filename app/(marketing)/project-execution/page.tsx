import type { Metadata } from "next";
import { AlertTriangle, GitBranch, KanbanSquare, Layers, ListChecks, Workflow } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

const TITLE = "Project Execution";
const DESCRIPTION =
  "Programs, milestones, tasks, dependencies, risks, and change requests on the same project record — not a separate PMO tool to keep in sync.";
const URL = "/project-execution";

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

export default function ProjectExecutionPage() {
  return (
    <SolutionPage
      data={{
        breadcrumbs: [{ label: "Solutions", href: URL }, { label: "Project Execution", href: URL }],
        eyebrow: "Project Execution",
        title: "A Kanban board and timeline for the projects you already track",
        description:
          "Group related projects into programs, break milestones into tasks and dependencies, log risks and issues as they come up, and route budget or timeline changes through the same approval authority as the original project — all without leaving the CSR record itself.",
        audience: [
          "CSR managers running multiple projects across NGO partners",
          "Program leads tracking a multi-year initiative as one portfolio",
          "Finance and governance teams reviewing budget or timeline changes",
          "Anyone who's been maintaining a parallel spreadsheet for milestone status",
        ],
        capabilities: [
          {
            icon: Layers,
            title: "Programs",
            description: "Group related projects under a named multi-year initiative and see the rollup in one place.",
          },
          {
            icon: KanbanSquare,
            title: "Milestone board",
            description: "A real Kanban view of every milestone by status, plus a timeline built from actual due dates.",
          },
          {
            icon: ListChecks,
            title: "Tasks",
            description: "Break a milestone into a checklist without inventing a new project entity for it.",
          },
          {
            icon: GitBranch,
            title: "Dependencies",
            description: "Link milestones that block each other — with real cycle detection, not just a text note.",
          },
          {
            icon: AlertTriangle,
            title: "Risk & issue log",
            description: "A project-scoped register with severity and status — the real precursor to enterprise risk management.",
          },
          {
            icon: Workflow,
            title: "Change requests",
            description: "Budget or timeline changes route through the same approval authority as the original project decision.",
          },
        ],
      }}
    />
  );
}
