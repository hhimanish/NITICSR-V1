"use client";

import { use, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SDG_NAMES: Record<number, string> = {
  1: "No Poverty",
  2: "Zero Hunger",
  3: "Good Health",
  4: "Quality Education",
  5: "Gender Equality",
  6: "Clean Water",
  7: "Clean Energy",
  8: "Decent Work",
  9: "Industry & Innovation",
  10: "Reduced Inequalities",
  11: "Sustainable Cities",
  12: "Responsible Consumption",
  13: "Climate Action",
  14: "Life Below Water",
  15: "Life on Land",
  16: "Peace & Institutions",
  17: "Partnerships",
};

type Location = { id: string; state: string; district: string | null };
type Beneficiary = { id: string; category: string; count_estimate: number | null };
type Sdg = { id: number; name: string; colorHex: string };

type ProjectDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  budget_amount: string | null;
  csr_category_key: string;
  locations: Location[] | null;
  milestones: unknown[] | null;
  beneficiaries: Beneficiary[] | null;
  sdgs: Sdg[] | null;
};

const STATUSES = ["draft", "proposed", "approved", "active", "completed", "cancelled"];

export default function CsrProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  function reload() {
    fetch(`/api/v1/csr-projects/${id}`)
      .then((r) => r.json())
      .then((body) => (body.data ? setProject(body.data) : setError(body.error)));
  }

  useEffect(reload, [id]);

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

  async function toggleSdg(sdgId: number) {
    const current = (project?.sdgs ?? []).map((s) => s.id);
    const next = current.includes(sdgId) ? current.filter((n) => n !== sdgId) : [...current, sdgId];
    try {
      const res = await fetch(`/api/v1/csr-projects/${id}/sdgs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdgIds: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not update SDGs");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update SDGs");
    }
  }

  async function addLocation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/v1/csr-projects/${id}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: form.get("state"), district: form.get("district") || undefined }),
    });
    if (res.ok) {
      e.currentTarget.reset();
      reload();
    }
  }

  async function addBeneficiary(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const countEstimate = form.get("countEstimate");
    const res = await fetch(`/api/v1/csr-projects/${id}/beneficiaries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.get("category"),
        countEstimate: countEstimate ? Number(countEstimate) : undefined,
      }),
    });
    if (res.ok) {
      e.currentTarget.reset();
      reload();
    }
  }

  if (error && !project) return <p className="text-sm text-destructive">{error}</p>;
  if (!project) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const selectedSdgIds = new Set((project.sdgs ?? []).map((s) => s.id));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold">{project.title}</h1>
      {project.description && <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
          <Select value={project.status} onValueChange={(v) => v && handleStatusChange(v)}>
            <SelectTrigger className="mt-1 w-40" disabled={updating} aria-label="Project status">
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

      <section className="mt-6">
        <h2 className="font-heading text-lg font-semibold">SDG alignment</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(SDG_NAMES).map(([idStr, name]) => {
            const sdgId = Number(idStr);
            const active = selectedSdgIds.has(sdgId);
            return (
              <button
                key={sdgId}
                type="button"
                onClick={() => toggleSdg(sdgId)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {sdgId}. {name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-heading text-lg font-semibold">Locations</h2>
        {project.locations && project.locations.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {project.locations.map((l) => (
              <li key={l.id} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                {l.state}
                {l.district ? `, ${l.district}` : ""}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addLocation} className="mt-3 flex flex-wrap gap-2">
          <Input name="state" placeholder="State" required className="w-40" />
          <Input name="district" placeholder="District (optional)" className="w-48" />
          <Button type="submit" size="sm" variant="outline">
            Add location
          </Button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-heading text-lg font-semibold">Beneficiaries</h2>
        {project.beneficiaries && project.beneficiaries.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {project.beneficiaries.map((b) => (
              <li key={b.id} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                {b.category}
                {b.count_estimate ? ` — ~${b.count_estimate.toLocaleString("en-IN")}` : ""}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addBeneficiary} className="mt-3 flex flex-wrap gap-2">
          <Input name="category" placeholder="Category (e.g. children)" required className="w-48" />
          <Input name="countEstimate" type="number" min={0} placeholder="Estimated count" className="w-40" />
          <Button type="submit" size="sm" variant="outline">
            Add beneficiary group
          </Button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-heading text-lg font-semibold">Milestones</h2>
        {!project.milestones || project.milestones.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No milestones added yet.</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{project.milestones.length} milestone(s).</p>
        )}
      </section>
    </div>
  );
}
