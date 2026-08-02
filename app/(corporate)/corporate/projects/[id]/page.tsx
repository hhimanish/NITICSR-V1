"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Gauge, Loader2, MapPin, QrCode, RefreshCw, ShieldCheck } from "lucide-react";

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
  corporate_org_id: string;
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
  program_id: string | null;
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

type MilestoneRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "pending" | "in_progress" | "completed" | "delayed";
  evidence_url: string | null;
};
type TimelineEntry = { id: string; title: string; status: string; dueDate: string | null; positionPercent: number | null };
type MilestoneTask = { id: string; title: string; status: "pending" | "done" };
type MilestoneDependency = { id: string; depends_on_milestone_id: string; depends_on_title: string };
type ProjectRisk = {
  id: string;
  entry_type: "risk" | "issue";
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high";
  status: "open" | "mitigated" | "closed";
  owner_name: string | null;
};
type ChangeRequest = {
  id: string;
  field: "budget_amount" | "end_date";
  current_value: string;
  requested_value: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  requested_by_name: string | null;
  created_at: string;
};

type FieldVisit = {
  id: string;
  latitude: string;
  longitude: string;
  distance_km: string | null;
  within_geofence: boolean | null;
  note: string | null;
  created_at: string;
  checked_in_by_name: string | null;
};
type ProjectAsset = {
  id: string;
  name: string;
  status: "planned" | "installed" | "verified" | "damaged";
  latitude: string | null;
  longitude: string | null;
  evidence_url: string | null;
};

const ASSET_STATUSES: ProjectAsset["status"][] = ["planned", "installed", "verified", "damaged"];

const MILESTONE_STAGES: { status: MilestoneRow["status"]; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "in_progress", label: "In progress" },
  { status: "completed", label: "Completed" },
  { status: "delayed", label: "Delayed" },
];

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

  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);
  const [tasksByMilestone, setTasksByMilestone] = useState<Record<string, MilestoneTask[]>>({});
  const [dependenciesByMilestone, setDependenciesByMilestone] = useState<Record<string, MilestoneDependency[]>>({});
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [dependsOnId, setDependsOnId] = useState("");

  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [newRiskTitle, setNewRiskTitle] = useState("");
  const [newRiskType, setNewRiskType] = useState<"risk" | "issue">("risk");
  const [newRiskSeverity, setNewRiskSeverity] = useState<"low" | "medium" | "high">("medium");
  const [addingRisk, setAddingRisk] = useState(false);

  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [newChangeField, setNewChangeField] = useState<"budget_amount" | "end_date">("budget_amount");
  const [newChangeValue, setNewChangeValue] = useState("");
  const [newChangeReason, setNewChangeReason] = useState("");
  const [submittingChange, setSubmittingChange] = useState(false);

  const [fieldVisits, setFieldVisits] = useState<FieldVisit[]>([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [newAssetName, setNewAssetName] = useState("");
  const [addingAsset, setAddingAsset] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  function loadFieldData() {
    fetch(`/api/v1/csr-projects/${id}/field-visits`)
      .then((r) => r.json())
      .then((body) => setFieldVisits(body.data ?? []));
    fetch(`/api/v1/csr-projects/${id}/assets`)
      .then((r) => r.json())
      .then((body) => setAssets(body.data ?? []));
  }

  async function checkIn() {
    if (!navigator.geolocation) {
      setCheckInError("Geolocation is not available in this browser.");
      return;
    }
    setCheckingIn(true);
    setCheckInError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`/api/v1/csr-projects/${id}/field-visits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });
          if (res.ok) loadFieldData();
          else setCheckInError((await res.json()).error ?? "Could not record check-in");
        } finally {
          setCheckingIn(false);
        }
      },
      (geoError) => {
        setCheckInError(geoError.message || "Could not get your location");
        setCheckingIn(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function addAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!newAssetName.trim()) return;
    setAddingAsset(true);
    try {
      const res = await fetch(`/api/v1/csr-projects/${id}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAssetName }),
      });
      if (res.ok) {
        setNewAssetName("");
        loadFieldData();
      }
    } finally {
      setAddingAsset(false);
    }
  }

  async function setAssetStatus(assetId: string, status: ProjectAsset["status"]) {
    const res = await fetch(`/api/v1/csr-projects/${id}/assets/${assetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadFieldData();
  }

  function loadExecutionData() {
    fetch(`/api/v1/csr-projects/${id}/milestones`)
      .then((r) => r.json())
      .then((body) => setMilestones(body.data ?? []));
    fetch(`/api/v1/csr-projects/${id}/timeline`)
      .then((r) => r.json())
      .then((body) => setTimeline(body.data ?? []));
    fetch(`/api/v1/csr-projects/${id}/risks`)
      .then((r) => r.json())
      .then((body) => setRisks(body.data ?? []));
    fetch(`/api/v1/csr-projects/${id}/change-requests`)
      .then((r) => r.json())
      .then((body) => setChangeRequests(body.data ?? []));
  }

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
    loadExecutionData();
    loadFieldData();
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, [id]);

  useEffect(() => {
    if (!project?.corporate_org_id) return;
    fetch(`/api/v1/organizations/${project.corporate_org_id}/programs`)
      .then((r) => r.json())
      .then((body) => setPrograms(body.data ?? []));
  }, [project?.corporate_org_id]);

  async function assignProgram(programId: string) {
    const res = await fetch(`/api/v1/csr-projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programId: programId || null }),
    });
    if (res.ok) setProject((prev) => (prev ? { ...prev, program_id: programId || null } : prev));
  }

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

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    setAddingMilestone(true);
    try {
      const res = await fetch(`/api/v1/csr-projects/${id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newMilestoneTitle, dueDate: newMilestoneDueDate || undefined }),
      });
      if (res.ok) {
        setNewMilestoneTitle("");
        setNewMilestoneDueDate("");
        loadExecutionData();
      }
    } finally {
      setAddingMilestone(false);
    }
  }

  async function setMilestoneStatus(milestoneId: string, status: MilestoneRow["status"]) {
    const res = await fetch(`/api/v1/csr-projects/${id}/milestones/${milestoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadExecutionData();
  }

  function loadMilestoneDetail(milestoneId: string) {
    fetch(`/api/v1/csr-projects/${id}/milestones/${milestoneId}/tasks`)
      .then((r) => r.json())
      .then((body) => setTasksByMilestone((prev) => ({ ...prev, [milestoneId]: body.data ?? [] })));
    fetch(`/api/v1/csr-projects/${id}/milestones/${milestoneId}/dependencies`)
      .then((r) => r.json())
      .then((body) => setDependenciesByMilestone((prev) => ({ ...prev, [milestoneId]: body.data ?? [] })));
  }

  function toggleMilestoneExpand(milestoneId: string) {
    if (expandedMilestoneId === milestoneId) {
      setExpandedMilestoneId(null);
      return;
    }
    setExpandedMilestoneId(milestoneId);
    setDependsOnId("");
    loadMilestoneDetail(milestoneId);
  }

  async function addTask(milestoneId: string) {
    if (!newTaskTitle.trim()) return;
    const res = await fetch(`/api/v1/csr-projects/${id}/milestones/${milestoneId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTaskTitle }),
    });
    if (res.ok) {
      setNewTaskTitle("");
      loadMilestoneDetail(milestoneId);
    }
  }

  async function toggleTask(milestoneId: string, taskId: string, done: boolean) {
    const res = await fetch(`/api/v1/csr-projects/${id}/milestones/${milestoneId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: done ? "done" : "pending" }),
    });
    if (res.ok) loadMilestoneDetail(milestoneId);
  }

  async function addDependency(milestoneId: string) {
    if (!dependsOnId) return;
    const res = await fetch(`/api/v1/csr-projects/${id}/milestones/${milestoneId}/dependencies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependsOnMilestoneId: dependsOnId }),
    });
    const body = await res.json();
    if (res.ok) {
      setDependsOnId("");
      loadMilestoneDetail(milestoneId);
    } else {
      setError(body.error ?? "Could not add dependency");
    }
  }

  async function addRisk(e: React.FormEvent) {
    e.preventDefault();
    if (!newRiskTitle.trim()) return;
    setAddingRisk(true);
    try {
      const res = await fetch(`/api/v1/csr-projects/${id}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryType: newRiskType, title: newRiskTitle, severity: newRiskSeverity }),
      });
      if (res.ok) {
        setNewRiskTitle("");
        loadExecutionData();
      }
    } finally {
      setAddingRisk(false);
    }
  }

  async function updateRiskStatus(riskId: string, status: ProjectRisk["status"]) {
    const res = await fetch(`/api/v1/csr-projects/${id}/risks/${riskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadExecutionData();
  }

  async function submitChangeRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!newChangeValue.trim()) return;
    setSubmittingChange(true);
    try {
      const res = await fetch(`/api/v1/csr-projects/${id}/change-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: newChangeField,
          requestedValue: newChangeValue,
          reason: newChangeReason || undefined,
        }),
      });
      if (res.ok) {
        setNewChangeValue("");
        setNewChangeReason("");
        loadExecutionData();
      }
    } finally {
      setSubmittingChange(false);
    }
  }

  async function reviewChangeRequest(changeRequestId: string, status: "approved" | "rejected") {
    const res = await fetch(`/api/v1/csr-projects/${id}/change-requests/${changeRequestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      loadExecutionData();
      reload();
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
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Program</p>
          <Select value={project.program_id ?? ""} onValueChange={(v) => assignProgram(v ?? "")}>
            <SelectTrigger className="mt-1 w-44" aria-label="Program">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        {timeline.filter((t) => t.positionPercent !== null).length > 0 && (
          <div className="mt-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Timeline</p>
            <div className="relative mt-4 h-8 rounded-full bg-muted">
              {timeline
                .filter((t) => t.positionPercent !== null)
                .map((t) => (
                  <div
                    key={t.id}
                    title={`${t.title}${t.dueDate ? ` — ${new Date(t.dueDate).toLocaleDateString("en-IN")}` : ""}`}
                    className={cn(
                      "absolute top-1/2 size-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-background",
                      t.status === "completed" ? "bg-secondary" : t.status === "delayed" ? "bg-destructive" : "bg-primary"
                    )}
                    style={{ left: `${t.positionPercent}%` }}
                  />
                ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MILESTONE_STAGES.map((stage) => {
            const stageMilestones = milestones.filter((m) => m.status === stage.status);
            return (
              <div key={stage.status} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {stageMilestones.length}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {stageMilestones.map((m) => {
                    const isOpen = expandedMilestoneId === m.id;
                    const tasks = tasksByMilestone[m.id] ?? [];
                    const deps = dependenciesByMilestone[m.id] ?? [];
                    return (
                      <div key={m.id} className="rounded-xl border border-border bg-background p-3">
                        <button
                          type="button"
                          onClick={() => toggleMilestoneExpand(m.id)}
                          className="text-left text-sm font-medium hover:underline"
                        >
                          {m.title}
                        </button>
                        {m.due_date && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Due {new Date(m.due_date).toLocaleDateString("en-IN")}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {MILESTONE_STAGES.filter((s) => s.status !== stage.status).map((s) => (
                            <button
                              key={s.status}
                              type="button"
                              onClick={() => setMilestoneStatus(m.id, s.status)}
                              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                            >
                              → {s.label}
                            </button>
                          ))}
                        </div>

                        {isOpen && (
                          <div className="mt-3 space-y-3 border-t border-border pt-3">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Tasks</p>
                              <ul className="mt-1.5 space-y-1">
                                {tasks.map((t) => (
                                  <li key={t.id} className="flex items-center gap-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={t.status === "done"}
                                      onChange={(e) => toggleTask(m.id, t.id, e.target.checked)}
                                    />
                                    <span className={t.status === "done" ? "text-muted-foreground line-through" : ""}>
                                      {t.title}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-1.5 flex gap-1.5">
                                <Input
                                  placeholder="New task"
                                  value={newTaskTitle}
                                  onChange={(e) => setNewTaskTitle(e.target.value)}
                                  className="h-7 text-xs"
                                />
                                <Button size="xs" variant="outline" onClick={() => addTask(m.id)}>
                                  Add
                                </Button>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Depends on</p>
                              {deps.length > 0 && (
                                <ul className="mt-1 space-y-0.5">
                                  {deps.map((d) => (
                                    <li key={d.id} className="text-xs text-muted-foreground">
                                      {d.depends_on_title}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <div className="mt-1.5 flex gap-1.5">
                                <Select value={dependsOnId} onValueChange={(v) => v && setDependsOnId(v)}>
                                  <SelectTrigger className="h-7 flex-1 text-xs" aria-label="Depends on milestone">
                                    <SelectValue placeholder="Select milestone" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {milestones
                                      .filter((other) => other.id !== m.id)
                                      .map((other) => (
                                        <SelectItem key={other.id} value={other.id}>
                                          {other.title}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <Button size="xs" variant="outline" onClick={() => addDependency(m.id)}>
                                  Link
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={addMilestone} className="mt-4 flex flex-wrap gap-2">
          <Input
            placeholder="Milestone title"
            value={newMilestoneTitle}
            onChange={(e) => setNewMilestoneTitle(e.target.value)}
            className="w-56"
          />
          <Input
            type="date"
            value={newMilestoneDueDate}
            onChange={(e) => setNewMilestoneDueDate(e.target.value)}
            className="w-40"
          />
          <Button type="submit" size="sm" variant="outline" disabled={addingMilestone || !newMilestoneTitle.trim()}>
            Add milestone
          </Button>
        </form>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Risks &amp; issues</h2>
          <ul className="mt-3 space-y-2">
            {risks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
            ) : (
              risks.map((r) => (
                <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      <span
                        className={cn(
                          "mr-1.5 inline-block size-1.5 rounded-full",
                          r.severity === "high" ? "bg-destructive" : r.severity === "medium" ? "bg-accent" : "bg-muted-foreground"
                        )}
                      />
                      {r.title}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {r.entry_type} · {r.severity}
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
              <Select value={newRiskType} onValueChange={(v) => v && setNewRiskType(v as "risk" | "issue")}>
                <SelectTrigger className="w-28" aria-label="Type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk">Risk</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newRiskSeverity} onValueChange={(v) => v && setNewRiskSeverity(v as "low" | "medium" | "high")}>
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
              <Input
                placeholder="Title"
                value={newRiskTitle}
                onChange={(e) => setNewRiskTitle(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" variant="outline" disabled={addingRisk}>
                Log
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Change requests</h2>
          <ul className="mt-3 space-y-2">
            {changeRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No change requests yet.</p>
            ) : (
              changeRequests.map((cr) => (
                <li key={cr.id} className="rounded-lg border border-border p-3 text-sm">
                  <p>
                    <span className="font-medium capitalize">{cr.field.replace("_", " ")}</span>: {cr.current_value} →{" "}
                    {cr.requested_value}
                  </p>
                  {cr.reason && <p className="mt-1 text-xs text-muted-foreground">{cr.reason}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        cr.status === "approved"
                          ? "bg-secondary/15 text-secondary"
                          : cr.status === "rejected"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-accent/15 text-accent-foreground"
                      )}
                    >
                      {cr.status}
                    </span>
                    {cr.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="xs" variant="outline" onClick={() => reviewChangeRequest(cr.id, "approved")}>
                          Approve
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => reviewChangeRequest(cr.id, "rejected")}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
          <form onSubmit={submitChangeRequest} className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Select value={newChangeField} onValueChange={(v) => v && setNewChangeField(v as "budget_amount" | "end_date")}>
                <SelectTrigger className="w-40" aria-label="Field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget_amount">Budget amount</SelectItem>
                  <SelectItem value="end_date">End date</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder={newChangeField === "end_date" ? "YYYY-MM-DD" : "New amount"}
                value={newChangeValue}
                onChange={(e) => setNewChangeValue(e.target.value)}
                className="flex-1"
              />
            </div>
            <Input
              placeholder="Reason (optional)"
              value={newChangeReason}
              onChange={(e) => setNewChangeReason(e.target.value)}
            />
            <Button type="submit" size="sm" variant="outline" disabled={submittingChange}>
              Submit request
            </Button>
          </form>
        </section>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Field visits</h2>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={checkingIn} onClick={checkIn}>
              {checkingIn ? <Loader2 className="size-3.5 animate-spin" /> : <MapPin className="size-3.5" />}
              Check in
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Uses your browser&apos;s location — validated against the project&apos;s registered site, within a 2km
            geofence.
          </p>
          {checkInError && <p className="mt-2 text-xs text-destructive">{checkInError}</p>}
          <ul className="mt-3 space-y-2">
            {fieldVisits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No field visits recorded yet.</p>
            ) : (
              fieldVisits.map((v) => (
                <li key={v.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{new Date(v.created_at).toLocaleString("en-IN")}</span>
                    {v.within_geofence === null ? (
                      <span className="text-xs text-muted-foreground">No registered location to check against</span>
                    ) : v.within_geofence ? (
                      <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-medium text-secondary">
                        Within site ({Number(v.distance_km).toFixed(1)}km)
                      </span>
                    ) : (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                        Outside site ({Number(v.distance_km).toFixed(1)}km)
                      </span>
                    )}
                  </div>
                  {v.checked_in_by_name && (
                    <p className="mt-1 text-xs text-muted-foreground">By {v.checked_in_by_name}</p>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Asset register</h2>
          <ul className="mt-3 space-y-2">
            {assets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assets logged yet.</p>
            ) : (
              assets.map((a) => (
                <li key={a.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{a.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ASSET_STATUSES.filter((s) => s !== a.status).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAssetStatus(a.id, s)}
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
          <form onSubmit={addAsset} className="mt-3 flex gap-2">
            <Input
              placeholder="Asset name (e.g. borewell)"
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" variant="outline" disabled={addingAsset}>
              Add
            </Button>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Field QR code</h2>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowQrCode((v) => !v)}>
            <QrCode className="size-3.5" />
            {showQrCode ? "Hide" : "Show"}
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Links back to this project — generated locally, printable for field reference.
        </p>
        {showQrCode && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/v1/csr-projects/${id}/qr-code`}
            alt="QR code linking to this project"
            className="mt-3 size-40"
          />
        )}
      </section>
    </div>
  );
}
