"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { useOrg } from "@/components/dashboard/org-context";

type Project = { id: string; title: string; status: string; ngo_profile_id: string | null };

export default function CorporateCompliancePage() {
  const org = useOrg();
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    fetch(`/api/v1/csr-projects?organizationId=${org.id}&limit=100`)
      .then((r) => r.json())
      .then((body) => setProjects(body.data ?? []));
  }, [org.id]);

  const withoutPartner = (projects ?? []).filter((p) => !p.ngo_profile_id && p.status !== "draft");

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Compliance</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A quick-glance view of gaps that could affect your CSR-2 disclosure.
      </p>

      {projects === null ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : withoutPartner.length === 0 ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-card p-6">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-secondary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Every active or proposed project has an implementing NGO assigned. No gaps flagged.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-foreground">
            {withoutPartner.length} project(s) without an assigned NGO partner
          </p>
          {withoutPartner.map((p) => (
            <div key={p.id} className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
              {p.title} — <span className="capitalize text-muted-foreground">{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
