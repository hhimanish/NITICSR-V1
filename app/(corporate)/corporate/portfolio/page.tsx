"use client";

import { useEffect, useState } from "react";
import { Boxes, FolderKanban, HandCoins, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { useOrg } from "@/components/dashboard/org-context";

type PortfolioRollup = {
  totalPrograms: number;
  totalProjects: number;
  projectsByStatus: Record<string, number>;
  budgetByStatus: Record<string, number>;
  programs: { id: string; name: string; projectCount: number; totalBudget: number }[];
};

export default function PortfolioPage() {
  const org = useOrg();
  const [rollup, setRollup] = useState<PortfolioRollup | null>(null);
  const [programName, setProgramName] = useState("");
  const [programDescription, setProgramDescription] = useState("");
  const [creatingProgram, setCreatingProgram] = useState(false);

  function load() {
    fetch(`/api/v1/organizations/${org.id}/portfolio`)
      .then((r) => r.json())
      .then((body) => setRollup(body.data ?? null));
  }

  useEffect(load, [org.id]);

  async function createProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!programName.trim()) return;
    setCreatingProgram(true);
    try {
      const res = await fetch(`/api/v1/organizations/${org.id}/programs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: programName, description: programDescription || undefined }),
      });
      if (res.ok) {
        setProgramName("");
        setProgramDescription("");
        load();
      }
    } finally {
      setCreatingProgram(false);
    }
  }

  const activeBudget = (rollup?.budgetByStatus.active ?? 0) + (rollup?.budgetByStatus.completed ?? 0);

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Portfolio</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every program and project across your CSR portfolio, rolled up in one view.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={Layers} label="Programs" value={String(rollup?.totalPrograms ?? 0)} />
        <KpiTile icon={FolderKanban} label="Total projects" value={String(rollup?.totalProjects ?? 0)} />
        <KpiTile
          icon={HandCoins}
          label="Active + completed funding"
          value={`₹${activeBudget.toLocaleString("en-IN")}`}
        />
        <KpiTile
          icon={Boxes}
          label="Proposed"
          value={String(rollup?.projectsByStatus.proposed ?? 0)}
          hint="Awaiting decision"
        />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Projects by status</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(rollup?.projectsByStatus ?? {}).map(([status, count]) => (
            <span key={status} className="rounded-full border border-border px-3 py-1 text-xs">
              <span className="font-medium capitalize">{status}</span> · {count}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Programs</h2>
        {rollup && rollup.programs.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No programs yet — group related projects under one.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {rollup?.programs.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl border border-border p-4 text-sm">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.projectCount} project(s)</p>
                </div>
                <span className="font-numeric text-sm">₹{p.totalBudget.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={createProgram} className="mt-4 space-y-2">
          <Input placeholder="Program name" value={programName} onChange={(e) => setProgramName(e.target.value)} />
          <Textarea
            placeholder="Description (optional)"
            rows={2}
            value={programDescription}
            onChange={(e) => setProgramDescription(e.target.value)}
          />
          <Button type="submit" size="sm" variant="outline" disabled={creatingProgram || !programName.trim()}>
            Create program
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Assign a project to a program from that project&apos;s detail page.
        </p>
      </section>
    </div>
  );
}
