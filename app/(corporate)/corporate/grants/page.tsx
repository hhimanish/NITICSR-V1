"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOrg } from "@/components/dashboard/org-context";

type Project = {
  id: string;
  title: string;
  status: string;
  budget_amount: string | null;
  ngo_profile_id: string | null;
  ngo_name?: string;
};

const PIPELINE_STAGES: { status: string; label: string }[] = [
  { status: "proposed", label: "Proposed" },
  { status: "approved", label: "Approved" },
  { status: "active", label: "Active" },
  { status: "completed", label: "Completed" },
];

export default function GrantsPipelinePage() {
  const org = useOrg();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  function load() {
    fetch(`/api/v1/csr-projects?organizationId=${org.id}&limit=200`)
      .then((r) => r.json())
      .then((body) => setProjects(body.data ?? []));
  }

  useEffect(load, [org.id]);

  async function renew(projectId: string) {
    setRenewingId(projectId);
    try {
      const res = await fetch(`/api/v1/csr-projects/${projectId}/renew`, { method: "POST" });
      if (res.ok) load();
    } finally {
      setRenewingId(null);
    }
  }

  const totalBudget = (projects ?? [])
    .filter((p) => p.status === "active" || p.status === "completed")
    .reduce((sum, p) => sum + (p.budget_amount ? Number(p.budget_amount) : 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Grants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The full grant lifecycle, from proposal through renewal, in one view.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-5 py-3 text-right">
          <p className="text-xs font-medium text-muted-foreground">Active + completed funding</p>
          <p className="font-numeric text-xl font-semibold">₹{totalBudget.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {projects === null ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageProjects = projects.filter((p) => p.status === stage.status);
            return (
              <div key={stage.status} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-sm font-semibold">{stage.label}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {stageProjects.length}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {stageProjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nothing here yet.</p>
                  ) : (
                    stageProjects.map((p) => (
                      <div key={p.id} className="rounded-xl border border-border bg-background p-3">
                        <Link href={`/corporate/projects/${p.id}`} className="text-sm font-medium hover:underline">
                          {p.title}
                        </Link>
                        {p.budget_amount && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            ₹{Number(p.budget_amount).toLocaleString("en-IN")}
                          </p>
                        )}
                        {stage.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full gap-1.5"
                            disabled={renewingId === p.id}
                            onClick={() => renew(p.id)}
                          >
                            {renewingId === p.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="size-3.5" />
                            )}
                            Renew
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
