"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOrg } from "@/components/dashboard/org-context";

type VerificationRequest = { id: string; status: string; review_notes: string | null; created_at: string };

export default function NgoVerificationPage() {
  const org = useOrg();
  const [ngoProfileId, setNgoProfileId] = useState<string | null>(null);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadRequests() {
    fetch(`/api/v1/verification-requests?organizationId=${org.id}`)
      .then((r) => r.json())
      .then((body) => setRequests(body.data ?? []));
  }

  useEffect(() => {
    fetch(`/api/v1/organizations/${org.id}/ngo-profile`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => setNgoProfileId(body?.data?.id ?? null))
      .finally(() => setLoading(false));
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id]);

  async function handleSubmit() {
    if (!ngoProfileId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/verification-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngoProfileId, organizationId: org.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not submit for verification");
      loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit for verification");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold">Verification</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Submit your organization for manual verification review.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : !ngoProfileId ? (
        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
          Complete your{" "}
          <Link href="/ngo/settings" className="font-medium text-secondary hover:underline">
            organization profile
          </Link>{" "}
          before submitting for verification.
        </div>
      ) : (
        <Button onClick={handleSubmit} disabled={submitting} className="mt-6 gap-2">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Submit for verification
        </Button>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-8 space-y-2">
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{r.status.replace("_", " ")}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("en-IN")}
              </span>
            </div>
            {r.review_notes && <p className="mt-1 text-muted-foreground">{r.review_notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
