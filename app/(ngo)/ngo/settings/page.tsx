"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TrustScoreWidget } from "@/components/design-system/trust-score-widget";
import { VerificationBadge, type VerificationStatus } from "@/components/design-system/verification-badge";
import { useOrg } from "@/components/dashboard/org-context";
import { FeatureFlagsPanel } from "@/components/dashboard/feature-flags-panel";
import { CSR_CATEGORIES } from "@/lib/csr-categories";

const DOCUMENT_TYPES = ["12A", "80G", "FCRA", "CSR1", "PAN", "REGISTRATION_CERTIFICATE", "OTHER"] as const;

type NgoDocument = {
  id: string;
  document_type: string;
  status: "pending" | "verified" | "expired" | "rejected";
  issued_at: string | null;
  expires_at: string | null;
};

type TrustScore = {
  score: number;
  verificationComponent: number | null;
  projectSuccessComponent: number | null;
  notes: string;
} | null;

function documentBadgeStatus(status: NgoDocument["status"]): VerificationStatus {
  if (status === "verified") return "verified";
  if (status === "expired" || status === "rejected") return "expired";
  return "pending";
}

type ProfileForm = {
  legalName: string;
  headquartersState: string;
  operatingStates: string;
  description: string;
  website: string;
  causeCategoryKeys: string[];
};

const EMPTY_FORM: ProfileForm = {
  legalName: "",
  headquartersState: "",
  operatingStates: "",
  description: "",
  website: "",
  causeCategoryKeys: [],
};

export default function NgoSettingsPage() {
  const org = useOrg();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ngoProfileId, setNgoProfileId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<NgoDocument[]>([]);
  const [trustScore, setTrustScore] = useState<TrustScore>(null);
  const [docType, setDocType] = useState<string>("");
  const [docExpiresAt, setDocExpiresAt] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);

  function loadIntelligence(profileId: string) {
    fetch(`/api/v1/organizations/${org.id}/ngo-profile/documents`)
      .then((r) => r.json())
      .then((body) => setDocuments(body.data ?? []));
    fetch(`/api/v1/ngo-profiles/${profileId}`)
      .then((r) => r.json())
      .then((body) => setTrustScore(body.data?.trustScore ?? null));
  }

  useEffect(() => {
    fetch(`/api/v1/organizations/${org.id}/ngo-profile`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (body?.data) {
          setForm({
            legalName: body.data.legal_name ?? "",
            headquartersState: body.data.headquarters_state ?? "",
            operatingStates: (body.data.operating_states ?? []).join(", "),
            description: body.data.description ?? "",
            website: body.data.website ?? "",
            causeCategoryKeys: body.data.cause_category_keys ?? [],
          });
          setNgoProfileId(body.data.id);
          loadIntelligence(body.data.id);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id]);

  async function addDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!docType) return;
    setAddingDoc(true);
    try {
      const res = await fetch(`/api/v1/organizations/${org.id}/ngo-profile/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: docType, expiresAt: docExpiresAt || undefined }),
      });
      if (res.ok) {
        setDocType("");
        setDocExpiresAt("");
        if (ngoProfileId) loadIntelligence(ngoProfileId);
      }
    } finally {
      setAddingDoc(false);
    }
  }

  function toggleCause(key: string) {
    setForm((prev) => ({
      ...prev,
      causeCategoryKeys: prev.causeCategoryKeys.includes(key)
        ? prev.causeCategoryKeys.filter((k) => k !== key)
        : [...prev.causeCategoryKeys, key],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/v1/organizations/${org.id}/ngo-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName: form.legalName,
          headquartersState: form.headquartersState || undefined,
          operatingStates: form.operatingStates
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          description: form.description || undefined,
          website: form.website || undefined,
          causeCategoryKeys: form.causeCategoryKeys,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not save profile");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold">Organization profile</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-1.5">
          <Label htmlFor="legalName">Legal name</Label>
          <Input
            id="legalName"
            required
            minLength={2}
            value={form.legalName}
            onChange={(e) => setForm((p) => ({ ...p, legalName: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hqState">Headquarters state</Label>
            <Input
              id="hqState"
              value={form.headquartersState}
              onChange={(e) => setForm((p) => ({ ...p, headquartersState: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="opStates">Operating states (comma-separated)</Label>
            <Input
              id="opStates"
              value={form.operatingStates}
              onChange={(e) => setForm((p) => ({ ...p, operatingStates: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Cause areas</Label>
          <div className="flex flex-wrap gap-2">
            {CSR_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleCause(c.key)}
                className={
                  form.causeCategoryKeys.includes(c.key)
                    ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                    : "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-secondary">Saved.</p>}

        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save profile
        </Button>
      </form>

      {ngoProfileId && (
        <>
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">Verification &amp; trust</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              How corporates evaluating your NGO see your standing — computed only from real
              documents and project history, never estimated.
            </p>
            <div className="mt-4">
              {trustScore ? (
                <TrustScoreWidget
                  score={trustScore.score}
                  size={100}
                  breakdown={[
                    trustScore.verificationComponent !== null && {
                      label: "Verification",
                      value: trustScore.verificationComponent,
                    },
                    trustScore.projectSuccessComponent !== null && {
                      label: "Project track record",
                      value: trustScore.projectSuccessComponent,
                    },
                  ].filter((v): v is { label: string; value: number } => Boolean(v))}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not yet scorable — add documents or complete a project to build your score.
                </p>
              )}
              {trustScore?.notes && <p className="mt-3 text-xs text-muted-foreground">{trustScore.notes}</p>}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">Documents</h2>
            {documents.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No documents added yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span>{d.document_type}</span>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      {d.expires_at && <span>Expires {new Date(d.expires_at).toLocaleDateString("en-IN")}</span>}
                      <VerificationBadge label={d.status} status={documentBadgeStatus(d.status)} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={addDocument} className="mt-4 flex flex-wrap items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="docType">Document type</Label>
                <Select value={docType} onValueChange={(v) => setDocType(v ?? "")}>
                  <SelectTrigger id="docType" className="w-56" aria-label="Document type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="docExpires">Expires (optional)</Label>
                <Input
                  id="docExpires"
                  type="date"
                  value={docExpiresAt}
                  onChange={(e) => setDocExpiresAt(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button type="submit" size="sm" variant="outline" disabled={!docType || addingDoc}>
                Add document
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              An auditor verifies each document before it counts toward your verification score.
            </p>
          </div>
        </>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">Platform features</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Opt your organization in or out of platform capabilities individually.
        </p>
        <div className="mt-4">
          <FeatureFlagsPanel />
        </div>
      </div>
    </div>
  );
}
