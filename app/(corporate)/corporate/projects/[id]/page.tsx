"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Gauge, RefreshCw, ShieldCheck } from "lucide-react";

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
  is_ongoing_project: boolean;
};

const STATUSES = ["draft", "proposed", "approved", "active", "completed", "cancelled"];

type ComplianceCheck = { key: string; label: string; passed: boolean; severity: "high" | "medium" | "low" };
type Obligation = { id: string; description: string; due_date: string; status: "pending" | "satisfied" | "waived" };
type Compliance = { checks: ComplianceCheck[]; obligations: Obligation[]; score: number };

type ReadinessCheck = { key: string; label: string; passed: boolean; severity: "high" | "medium" | "low" };
type ProposalScore = {
  score: number;
  readinessComponent: number;
  ngoTrustComponent: number | null;
  costPerBeneficiary: number | null;
  checks: ReadinessCheck[];
};
type Review = { id: string; recommendation: string; notes: string | null; created_at: string; reviewed_by_name: string | null };
type Agreement = { id: string; terms: string; acknowledged_at: string | null; acknowledged_by_name: string | null } | null;
type Disbursement = {
  id: string;
  amount: string;
  note: string | null;
  vendor_name: string | null;
  expense_category: string | null;
  invoice_reference: string | null;
  created_at: string;
  recorded_by_name: string | null;
};
type DisbursementData = {
  disbursements: Disbursement[];
  summary: { totalDisbursed: number; budgetAmount: number | null; remaining: number | null; percentUsed: number | null };
};
type Forecast = {
  remainingBudget: number;
  dailyRate: number;
  projectedExhaustionDate: string | null;
  exhausted: boolean;
} | null;

export default function CsrProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [compliance, setCompliance] = useState<Compliance | null>(null);
  const [proposalScore, setProposalScore] = useState<ProposalScore | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewRecommendation, setReviewRecommendation] = useState("recommend");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [agreement, setAgreement] = useState<Agreement>(null);
  const [agreementTerms, setAgreementTerms] = useState("");
  const [savingAgreement, setSavingAgreement] = useState(false);
  const [disbursementData, setDisbursementData] = useState<DisbursementData | null>(null);
  const [disbursementAmount, setDisbursementAmount] = useState("");
  const [disbursementNote, setDisbursementNote] = useState("");
  const [disbursementVendor, setDisbursementVendor] = useState("");
  const [disbursementCategory, setDisbursementCategory] = useState("");
  const [disbursementInvoiceRef, setDisbursementInvoiceRef] = useState("");
  const [addingDisbursement, setAddingDisbursement] = useState(false);
  const [forecast, setForecast] = useState<Forecast>(null);
  const [renewing, setRenewing] = useState(false);

  function loadGrantData() {
    fetch(`/api/v1/csr-projects/${id}/score`)
      .then((r) => r.json())
      .then((body) => setProposalScore(body.data ?? null))
      .catch(() => setProposalScore(null));
    fetch(`/api/v1/csr-projects/${id}/reviews`)
      .then((r) => r.json())
      .then((body) => setReviews(body.data ?? []));
    fetch(`/api/v1/csr-projects/${id}/agreement`)
      .then((r) => r.json())
      .then((body) => {
        setAgreement(body.data ?? null);
        setAgreementTerms(body.data?.terms ?? "");
      });
    fetch(`/api/v1/csr-projects/${id}/disbursements`)
      .then((r) => r.json())
      .then((body) => setDisbursementData(body.data ?? null));
    fetch(`/api/v1/csr-projects/${id}/forecast`)
      .then((r) => r.json())
      .then((body) => setForecast(body.data ?? null))
      .catch(() => setForecast(null));
  }

  function reload() {
    fetch(`/api/v1/csr-projects/${id}`)
      .then((r) => r.json())
      .then((body) => (body.data ? setProject(body.data) : setError(body.error)));
    fetch(`/api/v1/csr-projects/${id}/compliance`)
      .then((r) => r.json())
      .then((body) => setCompliance(body.data ?? null))
      .catch(() => setCompliance(null));
    loadGrantData();
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, [id]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/v1/csr-projects/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation: reviewRecommendation, notes: reviewNotes || undefined }),
      });
      if (res.ok) {
        setReviewNotes("");
        loadGrantData();
      }
    } finally {
      setSubmittingReview(false);
    }
  }

  async function saveAgreement() {
    setSavingAgreement(true);
    try {
      const res = await fetch(`/api/v1/csr-projects/${id}/agreement`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms: agreementTerms }),
      });
      if (res.ok) loadGrantData();
    } finally {
      setSavingAgreement(false);
    }
  }

  async function addDisbursement(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(disbursementAmount);
    if (!amount || amount <= 0) return;
    setAddingDisbursement(true);
    try {
      const res = await fetch(`/api/v1/csr-projects/${id}/disbursements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          note: disbursementNote || undefined,
          vendorName: disbursementVendor || undefined,
          expenseCategory: disbursementCategory || undefined,
          invoiceReference: disbursementInvoiceRef || undefined,
        }),
      });
      if (res.ok) {
        setDisbursementAmount("");
        setDisbursementNote("");
        setDisbursementVendor("");
        setDisbursementCategory("");
        setDisbursementInvoiceRef("");
        loadGrantData();
      }
    } finally {
      setAddingDisbursement(false);
    }
  }

  async function renewProject() {
    setRenewing(true);
    try {
      const res = await fetch(`/api/v1/csr-projects/${id}/renew`, { method: "POST" });
      const body = await res.json();
      if (res.ok) window.location.href = `/corporate/projects/${body.data.id}`;
    } finally {
      setRenewing(false);
    }
  }

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

  async function toggleOngoing() {
    const next = !project?.is_ongoing_project;
    try {
      const res = await fetch(`/api/v1/csr-projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOngoingProject: next }),
      });
      if (res.ok) setProject((prev) => (prev ? { ...prev, is_ongoing_project: next } : prev));
    } catch {
      // best-effort — the toggle simply won't flip if this fails
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
    <div className="mx-auto max-w-4xl">
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
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Project type</p>
          <button
            type="button"
            onClick={toggleOngoing}
            className="mt-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            {project.is_ongoing_project ? "Ongoing (multi-year)" : "One-time"}
          </button>
        </div>
        {project.status === "completed" && (
          <Button size="sm" variant="outline" className="ml-auto gap-1.5" disabled={renewing} onClick={renewProject}>
            <RefreshCw className="size-3.5" />
            Renew as new grant
          </Button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {compliance && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Compliance</h2>
            <span className="flex items-center gap-2 text-sm font-medium">
              {compliance.score < 100 ? (
                <AlertTriangle className="size-4 text-accent" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-4 text-secondary" aria-hidden="true" />
              )}
              {compliance.score}%
            </span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {compliance.checks.map((c) => (
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
          {compliance.obligations.length > 0 && (
            <>
              <p className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Regulatory obligations
              </p>
              <ul className="mt-2 space-y-1.5">
                {compliance.obligations.map((o) => (
                  <li key={o.id} className="text-sm text-muted-foreground">
                    {o.description} — due {new Date(o.due_date).toLocaleDateString("en-IN")} &middot;{" "}
                    <span className="capitalize">{o.status}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Manage filing status from the{" "}
                <Link href="/corporate/compliance" className="text-secondary hover:underline">
                  Compliance workspace
                </Link>
                .
              </p>
            </>
          )}
        </section>
      )}

      {proposalScore && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Proposal readiness</h2>
            <span className="flex items-center gap-2 text-sm font-medium">
              <Gauge className="size-4 text-secondary" aria-hidden="true" />
              {proposalScore.score}%
            </span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {proposalScore.checks.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-sm">
                <span
                  className={
                    c.passed ? "size-1.5 shrink-0 rounded-full bg-secondary" : "size-1.5 shrink-0 rounded-full bg-accent"
                  }
                  aria-hidden="true"
                />
                {c.label}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            {proposalScore.ngoTrustComponent !== null
              ? `Blends readiness (${proposalScore.readinessComponent}%) with the implementing NGO's trust score (${proposalScore.ngoTrustComponent}%).`
              : `Readiness only — the implementing NGO doesn't have a trust score yet.`}
            {proposalScore.costPerBeneficiary !== null &&
              ` Cost per beneficiary: ₹${proposalScore.costPerBeneficiary.toLocaleString("en-IN")} (informational — judge against your own benchmarks).`}
          </p>
        </section>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Reviews</h2>
          <ul className="mt-3 space-y-2">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No review notes yet.</p>
            ) : (
              reviews.map((r) => (
                <li key={r.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{r.recommendation.replace(/_/g, " ")}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  {r.notes && <p className="mt-1 text-muted-foreground">{r.notes}</p>}
                </li>
              ))
            )}
          </ul>
          <form onSubmit={submitReview} className="mt-4 space-y-2">
            <Select value={reviewRecommendation} onValueChange={(v) => v && setReviewRecommendation(v)}>
              <SelectTrigger className="w-full" aria-label="Recommendation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommend">Recommend</SelectItem>
                <SelectItem value="recommend_with_conditions">Recommend with conditions</SelectItem>
                <SelectItem value="not_recommend">Do not recommend</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Review notes (optional)"
              rows={2}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
            <Button type="submit" size="sm" variant="outline" disabled={submittingReview}>
              Add review
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Grant agreement</h2>
          {agreement?.acknowledged_at ? (
            <p className="mt-1 text-xs text-secondary">
              Acknowledged by {agreement.acknowledged_by_name ?? "the NGO"} on{" "}
              {new Date(agreement.acknowledged_at).toLocaleDateString("en-IN")}.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Not yet acknowledged by the implementing NGO. Editing terms clears any prior acknowledgement.
            </p>
          )}
          <Textarea
            className="mt-3"
            rows={5}
            placeholder="Grant agreement terms…"
            value={agreementTerms}
            onChange={(e) => setAgreementTerms(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            disabled={savingAgreement || !agreementTerms.trim()}
            onClick={saveAgreement}
          >
            Save terms
          </Button>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Fund disbursement</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A utilization ledger — recorded amounts released against budget, not real payment execution.
        </p>
        {disbursementData?.summary.budgetAmount !== null && disbursementData?.summary.budgetAmount !== undefined && (
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-secondary"
                style={{ width: `${Math.min(100, disbursementData.summary.percentUsed ?? 0)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              ₹{disbursementData.summary.totalDisbursed.toLocaleString("en-IN")} disbursed of ₹
              {disbursementData.summary.budgetAmount.toLocaleString("en-IN")} ({disbursementData.summary.percentUsed}%)
            </p>
          </div>
        )}
        {forecast && !forecast.exhausted && forecast.projectedExhaustionDate && (
          <p className="mt-2 text-xs text-muted-foreground">
            At the current disbursement pace, the remaining ₹{forecast.remainingBudget.toLocaleString("en-IN")} is
            projected to be exhausted by {new Date(forecast.projectedExhaustionDate).toLocaleDateString("en-IN")}.
          </p>
        )}
        <ul className="mt-3 space-y-1.5">
          {(disbursementData?.disbursements ?? []).map((d) => (
            <li key={d.id} className="rounded-lg border border-border px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span>
                  ₹{Number(d.amount).toLocaleString("en-IN")}
                  {d.note ? ` — ${d.note}` : ""}
                </span>
                <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("en-IN")}</span>
              </div>
              {(d.vendor_name || d.expense_category || d.invoice_reference) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {[d.vendor_name, d.expense_category, d.invoice_reference && `Inv. ${d.invoice_reference}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={addDisbursement} className="mt-3 flex flex-wrap gap-2">
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Amount"
            value={disbursementAmount}
            onChange={(e) => setDisbursementAmount(e.target.value)}
            className="w-32"
          />
          <Input
            placeholder="Note (optional)"
            value={disbursementNote}
            onChange={(e) => setDisbursementNote(e.target.value)}
            className="w-40"
          />
          <Input
            placeholder="Vendor (optional)"
            value={disbursementVendor}
            onChange={(e) => setDisbursementVendor(e.target.value)}
            className="w-40"
          />
          <Input
            placeholder="Category (optional)"
            value={disbursementCategory}
            onChange={(e) => setDisbursementCategory(e.target.value)}
            className="w-36"
          />
          <Input
            placeholder="Invoice ref (optional)"
            value={disbursementInvoiceRef}
            onChange={(e) => setDisbursementInvoiceRef(e.target.value)}
            className="w-36"
          />
          <Button type="submit" size="sm" variant="outline" disabled={addingDisbursement}>
            Record disbursement
          </Button>
        </form>
      </section>

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
