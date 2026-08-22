"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  averageScore: number | null;
  projectsWithGaps: number;
  overdueObligations: number;
};

type UnspentTransfer = {
  id: string;
  unspent_amount: string;
  destination: "unspent_csr_account" | "schedule_vii_fund";
  due_date: string;
  status: "pending" | "transferred";
  project_title: string;
};

const DESTINATION_LABEL: Record<UnspentTransfer["destination"], string> = {
  unspent_csr_account: "Unspent CSR Account",
  schedule_vii_fund: "Schedule VII Fund",
};

export default function CorporateCompliancePage() {
  const org = useOrg();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, ComplianceDetail>>({});
  const [transfers, setTransfers] = useState<UnspentTransfer[] | null>(null);
  const [referenceByTransfer, setReferenceByTransfer] = useState<Record<string, string>>({});
  const [markingId, setMarkingId] = useState<string | null>(null);

  function loadTransfers() {
    fetch(`/api/v1/organizations/${org.id}/unspent-fund-transfers`)
      .then((r) => r.json())
      .then((body) => setTransfers(body.data ?? []));
  }

  useEffect(() => {
    fetch(`/api/v1/csr-projects?organizationId=${org.id}&limit=100`)
      .then((r) => r.json())
      .then((body) => setProjects(((body.data ?? []) as Project[]).filter((p) => p.status !== "draft")));

    fetch(`/api/v1/organizations/${org.id}/compliance-summary`)
      .then((r) => r.json())
      .then((body) => setSummary(body.data ?? null));

    loadTransfers();
  }, [org.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markTransferred(id: string) {
    setMarkingId(id);
    try {
      const res = await fetch(`/api/v1/unspent-fund-transfers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferReference: referenceByTransfer[id] || undefined }),
      });
      if (res.ok) loadTransfers();
    } finally {
      setMarkingId(null);
    }
  }

  const pendingTransfers = transfers?.filter((t) => t.status === "pending") ?? [];

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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiTile
            icon={ShieldCheck}
            label="Compliance score"
            value={summary.averageScore === null ? "—" : `${summary.averageScore}%`}
            hint={summary.averageScore === null ? "No approved projects yet" : undefined}
          />
          <KpiTile
            icon={AlertTriangle}
            label="Projects with gaps"
            value={String(summary.projectsWithGaps)}
            hint={`of ${summary.totalProjects}`}
          />
          <KpiTile icon={AlertTriangle} label="Overdue obligations" value={String(summary.overdueObligations)} />
          <KpiTile icon={ShieldCheck} label="Total projects" value={String(summary.totalProjects)} />
          <KpiTile
            icon={AlertTriangle}
            label="Unspent transfers pending"
            value={String(pendingTransfers.length)}
            hint={
              pendingTransfers.length > 0
                ? `₹${pendingTransfers
                    .reduce((sum, t) => sum + Number(t.unspent_amount), 0)
                    .toLocaleString("en-IN")}`
                : undefined
            }
          />
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Section 135(5)/(6) unspent-fund transfers</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Generated automatically when a project completes with budget left undisbursed — an ongoing
          project&apos;s unspent amount goes to the Unspent CSR Account within 30 days of FY end; any other
          project&apos;s goes to a Schedule VII fund within 6 months.
        </p>
        {transfers === null ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : transfers.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No unspent-fund obligations yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {transfers.map((t) => (
              <li key={t.id} className="rounded-xl border border-border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.project_title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ₹{Number(t.unspent_amount).toLocaleString("en-IN")} to {DESTINATION_LABEL[t.destination]} —
                      due {new Date(t.due_date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={
                      t.status === "transferred"
                        ? "rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-medium text-secondary"
                        : "rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-foreground"
                    }
                  >
                    {t.status === "transferred" ? "Transferred" : "Pending"}
                  </span>
                </div>
                {t.status === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Input
                      placeholder="Transfer reference (optional)"
                      value={referenceByTransfer[t.id] ?? ""}
                      onChange={(e) => setReferenceByTransfer((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      className="w-56"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={markingId === t.id}
                      onClick={() => markTransferred(t.id)}
                    >
                      Mark transferred
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

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
