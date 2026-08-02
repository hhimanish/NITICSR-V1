"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardCheck, ShieldAlert, Siren } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { useOrg } from "@/components/dashboard/org-context";
import { cn } from "@/lib/utils";

type Alert = { type: string; severity: "low" | "medium" | "high"; title: string; detail: string };
type Risk = {
  id: string;
  entry_type: "risk" | "issue";
  title: string;
  severity: "low" | "medium" | "high";
  status: "open" | "mitigated" | "closed";
  project_title: string | null;
};
type Control = {
  id: string;
  name: string;
  control_type: "preventive" | "detective" | "corrective";
  frequency: string;
  owner_name: string | null;
};
type Engagement = {
  id: string;
  title: string;
  scope: string | null;
  status: "planned" | "in_progress" | "completed";
  start_date: string | null;
  end_date: string | null;
};
type CapaItem = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "open" | "in_progress" | "done";
  audit_engagement_title: string | null;
};
type Incident = {
  id: string;
  category: string;
  severity: "low" | "medium" | "high";
  status: "open" | "investigating" | "resolved";
  description: string;
  five_whys: string[] | null;
};

const SEVERITY_DOT: Record<"low" | "medium" | "high", string> = {
  high: "bg-destructive",
  medium: "bg-accent",
  low: "bg-muted-foreground",
};

export default function AssurancePage() {
  const org = useOrg();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);

  const [risks, setRisks] = useState<Risk[]>([]);
  const [riskTitle, setRiskTitle] = useState("");
  const [riskType, setRiskType] = useState<"risk" | "issue">("risk");
  const [riskSeverity, setRiskSeverity] = useState<"low" | "medium" | "high">("medium");

  const [controls, setControls] = useState<Control[]>([]);
  const [controlName, setControlName] = useState("");
  const [controlType, setControlType] = useState<"preventive" | "detective" | "corrective">("preventive");

  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [engagementTitle, setEngagementTitle] = useState("");
  const [engagementScope, setEngagementScope] = useState("");

  const [capaItems, setCapaItems] = useState<CapaItem[]>([]);
  const [capaTitle, setCapaTitle] = useState("");
  const [capaDueDate, setCapaDueDate] = useState("");

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentCategory, setIncidentCategory] = useState("safety");
  const [incidentSeverity, setIncidentSeverity] = useState<"low" | "medium" | "high">("medium");
  const [incidentDescription, setIncidentDescription] = useState("");

  function load() {
    fetch(`/api/v1/organizations/${org.id}/alerts`)
      .then((r) => r.json())
      .then((body) => setAlerts(body.data ?? []));
    fetch(`/api/v1/organizations/${org.id}/risks`)
      .then((r) => r.json())
      .then((body) => setRisks(body.data ?? []));
    fetch(`/api/v1/organizations/${org.id}/controls`)
      .then((r) => r.json())
      .then((body) => setControls(body.data ?? []));
    fetch(`/api/v1/organizations/${org.id}/audit-engagements`)
      .then((r) => r.json())
      .then((body) => setEngagements(body.data ?? []));
    fetch(`/api/v1/organizations/${org.id}/capa-items`)
      .then((r) => r.json())
      .then((body) => setCapaItems(body.data ?? []));
    fetch(`/api/v1/organizations/${org.id}/incidents`)
      .then((r) => r.json())
      .then((body) => setIncidents(body.data ?? []));
  }

  useEffect(load, [org.id]);

  async function addRisk(e: React.FormEvent) {
    e.preventDefault();
    if (!riskTitle.trim()) return;
    const res = await fetch(`/api/v1/organizations/${org.id}/risks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryType: riskType, title: riskTitle, severity: riskSeverity }),
    });
    if (res.ok) {
      setRiskTitle("");
      load();
    }
  }

  async function updateRiskStatus(id: string, status: Risk["status"]) {
    const res = await fetch(`/api/v1/risks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  async function addControl(e: React.FormEvent) {
    e.preventDefault();
    if (!controlName.trim()) return;
    const res = await fetch(`/api/v1/organizations/${org.id}/controls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: controlName, controlType }),
    });
    if (res.ok) {
      setControlName("");
      load();
    }
  }

  async function addEngagement(e: React.FormEvent) {
    e.preventDefault();
    if (!engagementTitle.trim()) return;
    const res = await fetch(`/api/v1/organizations/${org.id}/audit-engagements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: engagementTitle, scope: engagementScope || undefined }),
    });
    if (res.ok) {
      setEngagementTitle("");
      setEngagementScope("");
      load();
    }
  }

  async function updateEngagementStatus(id: string, status: Engagement["status"]) {
    const res = await fetch(`/api/v1/audit-engagements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  async function addCapa(e: React.FormEvent) {
    e.preventDefault();
    if (!capaTitle.trim()) return;
    const res = await fetch(`/api/v1/organizations/${org.id}/capa-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: capaTitle, dueDate: capaDueDate || undefined }),
    });
    if (res.ok) {
      setCapaTitle("");
      setCapaDueDate("");
      load();
    }
  }

  async function updateCapaStatus(id: string, status: CapaItem["status"]) {
    const res = await fetch(`/api/v1/capa-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  async function addIncident(e: React.FormEvent) {
    e.preventDefault();
    if (!incidentDescription.trim()) return;
    const res = await fetch(`/api/v1/organizations/${org.id}/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: incidentCategory, severity: incidentSeverity, description: incidentDescription }),
    });
    if (res.ok) {
      setIncidentDescription("");
      load();
    }
  }

  async function updateIncidentStatus(id: string, status: Incident["status"]) {
    const res = await fetch(`/api/v1/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  const openRisks = risks.filter((r) => r.status === "open").length;
  const overdueCapa = capaItems.filter(
    (c) => c.status !== "done" && c.due_date && new Date(c.due_date) < new Date()
  ).length;
  const openIncidents = incidents.filter((i) => i.status !== "resolved").length;

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Risk, Audit &amp; Assurance</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every alert here traces to a real record — nothing is predicted or scored.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={ShieldAlert} label="Open risks" value={String(openRisks)} />
        <KpiTile icon={ClipboardCheck} label="Overdue corrective actions" value={String(overdueCapa)} />
        <KpiTile icon={AlertTriangle} label="Active control alerts" value={String(alerts?.length ?? 0)} />
        <KpiTile icon={Siren} label="Open incidents" value={String(openIncidents)} />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Continuous controls monitoring</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Computed fresh from real data every time this page loads — document expiry, geofence
          violations, overdue obligations and transfers, segregation-of-duty conflicts, duplicate
          beneficiary entries, overdue corrective actions, and disbursement-outlier ratios.
        </p>
        {alerts === null ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No active alerts.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {alerts.map((a, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
                <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", SEVERITY_DOT[a.severity])} />
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Risk register</h2>
          <ul className="mt-3 space-y-2">
            {risks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
            ) : (
              risks.map((r) => (
                <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      <span className={cn("mr-1.5 inline-block size-1.5 rounded-full", SEVERITY_DOT[r.severity])} />
                      {r.title}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {r.entry_type}
                      {r.project_title ? ` · ${r.project_title}` : " · organization-wide"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(["open", "mitigated", "closed"] as const)
                      .filter((s) => s !== r.status)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateRiskStatus(r.id, s)}
                          className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                        >
                          → {s}
                        </button>
                      ))}
                  </div>
                </li>
              ))
            )}
          </ul>
          <form onSubmit={addRisk} className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Select value={riskType} onValueChange={(v) => v && setRiskType(v as "risk" | "issue")}>
                <SelectTrigger className="w-28" aria-label="Type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk">Risk</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskSeverity} onValueChange={(v) => v && setRiskSeverity(v as "low" | "medium" | "high")}>
                <SelectTrigger className="w-28" aria-label="Severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Title" value={riskTitle} onChange={(e) => setRiskTitle(e.target.value)} className="flex-1" />
              <Button type="submit" size="sm" variant="outline">
                Log
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Controls library</h2>
          <ul className="mt-3 space-y-2">
            {controls.length === 0 ? (
              <p className="text-sm text-muted-foreground">No controls catalogued yet.</p>
            ) : (
              controls.map((c) => (
                <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {c.control_type} · {c.frequency}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
          <form onSubmit={addControl} className="mt-3 flex flex-wrap gap-2">
            <Input
              placeholder="Control name"
              value={controlName}
              onChange={(e) => setControlName(e.target.value)}
              className="flex-1"
            />
            <Select value={controlType} onValueChange={(v) => v && setControlType(v as typeof controlType)}>
              <SelectTrigger className="w-32" aria-label="Control type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preventive">Preventive</SelectItem>
                <SelectItem value="detective">Detective</SelectItem>
                <SelectItem value="corrective">Corrective</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" variant="outline">
              Add
            </Button>
          </form>
        </section>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Audit engagements</h2>
          <ul className="mt-3 space-y-2">
            {engagements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No engagements yet.</p>
            ) : (
              engagements.map((e) => (
                <li key={e.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{e.title}</span>
                    <span className="text-xs text-muted-foreground capitalize">{e.status.replace("_", " ")}</span>
                  </div>
                  {e.scope && <p className="mt-1 text-xs text-muted-foreground">{e.scope}</p>}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(["planned", "in_progress", "completed"] as const)
                      .filter((s) => s !== e.status)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateEngagementStatus(e.id, s)}
                          className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                        >
                          → {s.replace("_", " ")}
                        </button>
                      ))}
                  </div>
                </li>
              ))
            )}
          </ul>
          <form onSubmit={addEngagement} className="mt-3 space-y-2">
            <Input placeholder="Title" value={engagementTitle} onChange={(e) => setEngagementTitle(e.target.value)} />
            <Textarea
              placeholder="Scope (optional)"
              rows={2}
              value={engagementScope}
              onChange={(e) => setEngagementScope(e.target.value)}
            />
            <Button type="submit" size="sm" variant="outline">
              Create engagement
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Corrective actions (CAPA)</h2>
          <ul className="mt-3 space-y-2">
            {capaItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No corrective actions yet.</p>
            ) : (
              capaItems.map((c) => (
                <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.title}</span>
                    <span className="text-xs text-muted-foreground capitalize">{c.status.replace("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.audit_engagement_title ? `${c.audit_engagement_title} · ` : ""}
                    {c.due_date ? `Due ${new Date(c.due_date).toLocaleDateString("en-IN")}` : "No due date"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(["open", "in_progress", "done"] as const)
                      .filter((s) => s !== c.status)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateCapaStatus(c.id, s)}
                          className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                        >
                          → {s.replace("_", " ")}
                        </button>
                      ))}
                  </div>
                </li>
              ))
            )}
          </ul>
          <form onSubmit={addCapa} className="mt-3 flex flex-wrap gap-2">
            <Input
              placeholder="Corrective action"
              value={capaTitle}
              onChange={(e) => setCapaTitle(e.target.value)}
              className="flex-1"
            />
            <Input type="date" value={capaDueDate} onChange={(e) => setCapaDueDate(e.target.value)} className="w-40" />
            <Button type="submit" size="sm" variant="outline">
              Add
            </Button>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Incidents</h2>
        <ul className="mt-3 space-y-2">
          {incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No incidents logged.</p>
          ) : (
            incidents.map((i) => (
              <li key={i.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    <span className={cn("mr-1.5 inline-block size-1.5 rounded-full", SEVERITY_DOT[i.severity])} />
                    {i.description}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {i.category.replace("_", " ")} · {i.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(["open", "investigating", "resolved"] as const)
                    .filter((s) => s !== i.status)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateIncidentStatus(i.id, s)}
                        className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                      >
                        → {s}
                      </button>
                    ))}
                </div>
              </li>
            ))
          )}
        </ul>
        <form onSubmit={addIncident} className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Select value={incidentCategory} onValueChange={(v) => v && setIncidentCategory(v)}>
              <SelectTrigger className="w-44" aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="fraud">Fraud</SelectItem>
                <SelectItem value="data_breach">Data breach</SelectItem>
                <SelectItem value="beneficiary_complaint">Beneficiary complaint</SelectItem>
                <SelectItem value="reputational">Reputational</SelectItem>
                <SelectItem value="regulatory">Regulatory</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={incidentSeverity} onValueChange={(v) => v && setIncidentSeverity(v as "low" | "medium" | "high")}>
              <SelectTrigger className="w-28" aria-label="Severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="What happened?"
            rows={2}
            value={incidentDescription}
            onChange={(e) => setIncidentDescription(e.target.value)}
          />
          <Button type="submit" size="sm" variant="outline">
            Log incident
          </Button>
        </form>
      </section>
    </div>
  );
}
