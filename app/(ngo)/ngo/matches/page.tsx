"use client";

import { useEffect, useState } from "react";

import { useOrg } from "@/components/dashboard/org-context";

type Project = { id: string; title: string; status: string; budget_amount: string | null; csr_category_name?: string };

export default function NgoMatchesPage() {
  const org = useOrg();
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    fetch(`/api/v1/csr-projects?organizationId=${org.id}&limit=50`)
      .then((r) => r.json())
      .then((body) => setProjects(body.data ?? []));
  }, [org.id]);

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
          {projects.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-card p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.title}</span>
                <span className="text-muted-foreground capitalize">{p.status}</span>
              </div>
              {p.budget_amount && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Budget: ₹{Number(p.budget_amount).toLocaleString("en-IN")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
