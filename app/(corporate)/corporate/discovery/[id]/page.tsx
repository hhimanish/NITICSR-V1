"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { TrustScoreWidget } from "@/components/design-system/trust-score-widget";
import { VerificationBadge, type VerificationStatus } from "@/components/design-system/verification-badge";

type Document = {
  id: string;
  document_type: string;
  status: "pending" | "verified" | "expired" | "rejected";
  issued_at: string | null;
  expires_at: string | null;
};

type VerificationCheck = { provider: string; status: string; checked_at: string | null; expires_at: string | null };

type TrustScore = {
  score: number;
  verificationComponent: number | null;
  projectSuccessComponent: number | null;
  notes: string;
} | null;

type PartnershipStats = {
  totalCorporatePartners: number;
  totalProjects: number;
  projectsByStatus: Record<string, number>;
  totalFundingReceived: number;
};

type NgoDetail = {
  id: string;
  legal_name: string;
  registration_number: string | null;
  registration_type: string | null;
  pan: string | null;
  established_year: number | null;
  description: string | null;
  website: string | null;
  headquarters_state: string | null;
  operating_states: string[];
  cause_category_keys: string[];
  documents: Document[];
  verification: { requestStatus: string | null; reviewedAt: string | null; checks: VerificationCheck[] };
  trustScore: TrustScore;
  partnershipStats: PartnershipStats;
};

function documentBadgeStatus(status: Document["status"]): VerificationStatus {
  if (status === "verified") return "verified";
  if (status === "expired" || status === "rejected") return "expired";
  return "pending";
}

export default function NgoIntelligencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ngo, setNgo] = useState<NgoDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/ngo-profiles/${id}`)
      .then((r) => r.json())
      .then((body) => (body.data ? setNgo(body.data) : setError(body.error)));
  }, [id]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!ngo) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const breakdown = [
    ngo.trustScore?.verificationComponent !== null &&
      ngo.trustScore?.verificationComponent !== undefined && {
        label: "Verification",
        value: ngo.trustScore.verificationComponent,
      },
    ngo.trustScore?.projectSuccessComponent !== null &&
      ngo.trustScore?.projectSuccessComponent !== undefined && {
        label: "Project track record",
        value: ngo.trustScore.projectSuccessComponent,
      },
  ].filter((v): v is { label: string; value: number } => Boolean(v));

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/corporate/discovery"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to discovery
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{ngo.legal_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ngo.headquarters_state ?? "State not set"}
            {ngo.established_year ? ` · Established ${ngo.established_year}` : ""}
            {ngo.registration_type ? ` · ${ngo.registration_type}` : ""}
          </p>
          {ngo.description && <p className="mt-3 text-sm text-foreground/80">{ngo.description}</p>}
          {ngo.website && (
            <a href={ngo.website} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-secondary hover:underline">
              {ngo.website}
            </a>
          )}
        </div>

        {ngo.trustScore ? (
          <TrustScoreWidget score={ngo.trustScore.score} size={110} breakdown={breakdown} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Not yet scorable —
            <br />
            no verification or project history
          </div>
        )}
      </div>

      {ngo.trustScore?.notes && <p className="mt-4 text-xs text-muted-foreground">{ngo.trustScore.notes}</p>}

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Partnership history</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Aggregate only — individual corporates&apos; project details are never shown cross-tenant.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-numeric text-2xl font-semibold">{ngo.partnershipStats.totalCorporatePartners}</p>
            <p className="text-xs text-muted-foreground">Corporate partners</p>
          </div>
          <div>
            <p className="font-numeric text-2xl font-semibold">{ngo.partnershipStats.totalProjects}</p>
            <p className="text-xs text-muted-foreground">Total projects</p>
          </div>
          <div>
            <p className="font-numeric text-2xl font-semibold">
              ₹{ngo.partnershipStats.totalFundingReceived.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground">Active + completed funding</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Documents on file</h2>
        {ngo.documents.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {ngo.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>{d.document_type}</span>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  {d.expires_at && <span>Expires {new Date(d.expires_at).toLocaleDateString("en-IN")}</span>}
                  <VerificationBadge label={d.status} status={documentBadgeStatus(d.status)} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Regulatory verification</h2>
        {ngo.verification.checks.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No verification request submitted yet
            {ngo.verification.requestStatus ? ` (status: ${ngo.verification.requestStatus})` : ""}.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {ngo.verification.checks.map((c) => (
              <li key={c.provider} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>{c.provider}</span>
                <span className="text-xs text-muted-foreground capitalize">{c.status.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-heading text-lg font-semibold">Operating footprint</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {ngo.operating_states.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not recorded.</p>
          ) : (
            ngo.operating_states.map((s) => (
              <span key={s} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {s}
              </span>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
