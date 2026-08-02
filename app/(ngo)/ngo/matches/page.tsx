"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOrg } from "@/components/dashboard/org-context";

type Project = { id: string; title: string; status: string; budget_amount: string | null; csr_category_name?: string };
type Agreement = { id: string; terms: string; acknowledged_at: string | null } | null;

export default function NgoMatchesPage() {
  const org = useOrg();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [agreements, setAgreements] = useState<Record<string, Agreement>>({});
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/csr-projects?organizationId=${org.id}&limit=50`)
      .then((r) => r.json())
      .then((body) => setProjects(body.data ?? []));
  }, [org.id]);

  function loadAgreement(projectId: string) {
    fetch(`/api/v1/csr-projects/${projectId}/agreement`)
      .then((r) => r.json())
      .then((body) => setAgreements((prev) => ({ ...prev, [projectId]: body.data ?? null })));
  }

  function toggleExpand(projectId: string) {
    if (expandedId === projectId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(projectId);
    if (!(projectId in agreements)) loadAgreement(projectId);
  }

  async function acknowledge(projectId: string) {
    setAcknowledgingId(projectId);
    try {
      const res = await fetch(`/api/v1/csr-projects/${projectId}/agreement/acknowledge`, { method: "POST" });
      if (res.ok) loadAgreement(projectId);
    } finally {
      setAcknowledgingId(null);
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Corporate-funded projects</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Projects where a corporate has assigned your organization as the implementing NGO.
      </p>

      {projects === null ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No projects assigned yet. Complete verification to become discoverable to corporates.
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {projects.map((p) => {
            const agreement = agreements[p.id];
            const isOpen = expandedId === p.id;
            return (
              <li key={p.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                <button
                  type="button"
                  onClick={() => toggleExpand(p.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="font-medium">{p.title}</span>
                  <span className="text-muted-foreground capitalize">{p.status}</span>
                </button>
                {p.budget_amount && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Budget: ₹{Number(p.budget_amount).toLocaleString("en-IN")}
                  </p>
                )}
                {isOpen && (
                  <div className="mt-3 border-t border-border pt-3">
                    {agreement === undefined && <p className="text-xs text-muted-foreground">Loading agreement…</p>}
                    {agreement === null && (
                      <p className="text-xs text-muted-foreground">No grant agreement drafted yet.</p>
                    )}
                    {agreement && (
                      <>
                        <p className="whitespace-pre-wrap text-xs text-foreground/80">{agreement.terms}</p>
                        {agreement.acknowledged_at ? (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-secondary">
                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            Acknowledged {new Date(agreement.acknowledged_at).toLocaleDateString("en-IN")}
                          </p>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 gap-1.5"
                            disabled={acknowledgingId === p.id}
                            onClick={() => acknowledge(p.id)}
                          >
                            {acknowledgingId === p.id && <Loader2 className="size-3.5 animate-spin" />}
                            Acknowledge agreement
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
