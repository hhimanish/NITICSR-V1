"use client";

import { use, useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProjectDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  budget_amount: string | null;
  csr_category_key: string;
  locations: unknown[] | null;
  milestones: unknown[] | null;
};

const STATUSES = ["draft", "proposed", "approved", "active", "completed", "cancelled"];

export default function CsrProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/csr-projects/${id}`)
      .then((r) => r.json())
      .then((body) => (body.data ? setProject(body.data) : setError(body.error)));
  }, [id]);

  async function handleStatusChange(status: string) {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/csr-projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not update status");
      setProject((prev) => (prev ? { ...prev, status } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setUpdating(false);
    }
  }

  if (error && !project) return <p className="text-sm text-destructive">{error}</p>;
  if (!project) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold">{project.title}</h1>
      {project.description && <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
          <Select value={project.status} onValueChange={(v) => v && handleStatusChange(v)}>
            <SelectTrigger className="mt-1 w-40" disabled={updating}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {project.budget_amount && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Budget</p>
            <p className="mt-1 font-numeric text-lg font-semibold">
              ₹{Number(project.budget_amount).toLocaleString("en-IN")}
            </p>
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6">
        <h2 className="font-heading text-lg font-semibold">Milestones</h2>
        {!project.milestones || project.milestones.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No milestones added yet.</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{project.milestones.length} milestone(s).</p>
        )}
      </div>
    </div>
  );
}
