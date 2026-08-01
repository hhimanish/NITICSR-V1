"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { useOrg } from "@/components/dashboard/org-context";

type Project = { id: string; title: string; status: string };

type ComplianceCheck = { key: string; label: string; passed: boolean; severity: "high" | "medium" | "low" };
type Obligation = {
  id: string;
  description: string;
  due_date: string;
  status: "pending" | "satisfied" | "waived";
};
type ComplianceDetail = { checks: ComplianceCheck[]; obligations: Obligation[]; score: number };

type Summary = {
  totalProjects: number;
  averageScore: number;
  projectsWithGaps: number;
  overdueObligations: number;
};

export default function CorporateCompliancePage() {
  const org = useOrg();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, ComplianceDetail>>({});

  useEffect(() => {
    fetch(`/api/v1/csr-projects?organizationId=${org.id}&limit=100`)
      .then((r) => r.json())
      .then((body) => setProjects(((body.data ?? []) as Project[]).filter((p) => p.status !== "draft")));

    fetch(`/api/v1/organizations/${org.id}/compliance-summary`)
      .then((r) => r.json())
      .then((body) => setSummary(body.data ?? null));
  }, [org.id]);

  async function loadDetail(projectId: string) {
    const res = await fetch(`/api/v1/csr-projects/${projectId}/compliance`);
    const body = await res.json();
    setDetail((prev) => ({ ...prev, [projectId]: body.data }));
  }

  function toggleExpand(projectId: string) {
    if (expanded === projectId) {
      setExpanded(null);
      return;
    }
    setExpanded(projectId);
    if (!detail[projectId]) void loadDetail(projectId);
  }

  async function updateObligation(projectId: string, obligationId: string, status: "satisfied" | "waived") {
    const res = await fetch(`/api/v1/compliance-obligations/${obligationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await loadDetail(projectId);
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Compliance</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Real-time compliance posture per CSR project — Schedule VII obligations, data completeness, and governance
        sign-off — not a static checklist.
      </p>

      {summary && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile icon={ShieldCheck} label="Compliance score" value={`${summary.averageScore}%`} />
          <KpiTile
            icon={AlertTriangle}
            label="Projects with gaps"
            value={String(summary.projectsWithGaps)}
            hint={`of ${summary.totalProjects}`}
          />
          <KpiTile icon={AlertTriangle} label="Overdue obligations" value={String(summary.overdueObligations)} />
          <KpiTile icon={ShieldCheck} label="Total projects" value={String(summary.totalProjects)} />
        </div>
      )}

      <div className="mt-8 space-y-2">
        {projects === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No proposed, approved, or active projects yet.
          </div>
        ) : (
          projects.map((p) => {
            const d = detail[p.id];
            const isOpen = expanded === p.id;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card">
                <button
                  onClick={() => toggleExpand(p.id)}
                  className="flex w-full items-center justify-between p-4 text-left text-sm"
                >
                  <span className="flex items-center gap-2 font-medium">
                    {isOpen ? (
                      <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                    )}
                    {p.title}
                  </span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    {d && d.score < 100 && (
                      <AlertTriangle className="size-3.5 text-accent" aria-label="Compliance gap" />
                    )}
                    {d && <span className="font-numeric">{d.score}%</span>}
                    <span className="capitalize">{p.status}</span>
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-border p-4 pt-3">
                    {!d ? (
                      <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Data completeness checks
                          </h3>
                          <ul className="mt-2 space-y-1.5">
                            {d.checks.map((c) => (
                              <li key={c.key} className="flex items-center gap-2 text-sm">
                                <span
                                  className={
                                    c.passed
                                      ? "size-1.5 shrink-0 rounded-full bg-secondary"
                                      : "size-1.5 shrink-0 rounded-full bg-accent"
                                  }
                                  aria-hidden="true"
                                />
                                {c.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Regulatory obligations
                          </h3>
                          <ul className="mt-2 space-y-2">
                            {d.obligations.map((o) => (
                              <li key={o.id} className="rounded-lg border border-border p-3 text-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p>{o.description}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      Due {new Date(o.due_date).toLocaleDateString("en-IN")} &middot;{" "}
                                      <span className="capitalize">{o.status}</span>
                                    </p>
                                  </div>
                                  {o.status === "pending" && (
                                    <div className="flex shrink-0 gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateObligation(p.id, o.id, "satisfied")}
                                      >
                                        Mark filed
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => updateObligation(p.id, o.id, "waived")}
                                      >
                                        Waive
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
