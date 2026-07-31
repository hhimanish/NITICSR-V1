"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Gavel, HandCoins, TrendingUp, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { useOrg } from "@/components/dashboard/org-context";

type Project = {
  id: string;
  title: string;
  status: string;
  budget_amount: string | null;
  ngo_profile_id: string | null;
  created_at: string;
};

// A "proposed" project sitting this long without a decision is flagged as
// overdue — a real, small governance signal over existing data rather than
// a generic configurable SLA-timer system.
const OVERDUE_DAYS = 14;

export default function CorporateDashboardPage() {
  const org = useOrg();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [decisionCount, setDecisionCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/v1/csr-projects?organizationId=${org.id}&limit=50`)
      .then((r) => r.json())
      .then((body) => setProjects(body.data ?? []));

    fetch(`/api/v1/governance/decisions?organizationId=${org.id}&limit=100`)
      .then((r) => r.json())
      .then((body) => {
        const thirtyDaysAgo = Date.now() - 30 * 86_400_000;
        const recent = (body.data ?? []).filter(
          (d: { created_at: string }) => new Date(d.created_at).getTime() >= thirtyDaysAgo
        );
        setDecisionCount(recent.length);
      })
      .catch(() => setDecisionCount(0));
  }, [org.id]);

  const totalBudget = (projects ?? []).reduce(
    (sum, p) => sum + (p.budget_amount ? Number(p.budget_amount) : 0),
    0
  );
  const activeCount = (projects ?? []).filter((p) => p.status === "active").length;
  const ngoCount = new Set((projects ?? []).filter((p) => p.ngo_profile_id).map((p) => p.ngo_profile_id)).size;

  function isOverdue(p: Project) {
    if (p.status !== "proposed") return false;
    return Date.now() - new Date(p.created_at).getTime() > OVERDUE_DAYS * 86_400_000;
  }
  const overdueCount = (projects ?? []).filter(isOverdue).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{org.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Corporate CSR workspace</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/corporate/governance" />}>
            Governance
          </Button>
          <Button render={<Link href="/corporate/projects/new" />}>New project</Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile icon={Users} label="NGO partners" value={String(ngoCount)} />
        <KpiTile
          icon={HandCoins}
          label="Total CSR budget"
          value={`₹${totalBudget.toLocaleString("en-IN")}`}
        />
        <KpiTile
          icon={TrendingUp}
          label="Active projects"
          value={String(activeCount)}
          hint={`${projects?.length ?? 0} total`}
        />
        <KpiTile
          icon={AlertTriangle}
          label="Overdue proposals"
          value={String(overdueCount)}
          hint={`Pending >${OVERDUE_DAYS} days`}
        />
        <KpiTile icon={Gavel} label="Decisions (30d)" value={String(decisionCount ?? 0)} />
      </div>

      <div className="mt-8">
        <h2 className="font-heading text-lg font-semibold">Recent projects</h2>
        {projects === null ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No CSR projects yet.{" "}
            <Link href="/corporate/projects/new" className="text-secondary hover:underline">
              Create your first one
            </Link>
            .
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {projects.slice(0, 8).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/corporate/projects/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm transition-shadow hover:shadow-sm"
                >
                  <span className="font-medium">{p.title}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {isOverdue(p) && <AlertTriangle className="size-3.5 text-accent" aria-label="Overdue" />}
                    <span className="capitalize">{p.status}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
