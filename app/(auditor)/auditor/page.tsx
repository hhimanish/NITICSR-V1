"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOrg } from "@/components/dashboard/org-context";

type VerificationRequest = {
  id: string;
  status: string;
  ngo_profile_id: string;
  ngo_name: string;
  review_notes: string | null;
  created_at: string;
};

type PendingDocument = { id: string; document_type: string; ngo_profile_id: string };

export default function AuditorReviewQueuePage() {
  const org = useOrg();
  const [requests, setRequests] = useState<VerificationRequest[] | null>(null);
  const [notesByRequest, setNotesByRequest] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDocsByNgo, setPendingDocsByNgo] = useState<Record<string, PendingDocument[]>>({});
  const [docBusyId, setDocBusyId] = useState<string | null>(null);

  function load() {
    fetch(`/api/v1/verification-requests?organizationId=${org.id}`)
      .then((r) => r.json())
      .then((body) => {
        const reqs: VerificationRequest[] = body.data ?? [];
        setRequests(reqs);
        for (const r of reqs) loadPendingDocs(r.ngo_profile_id);
      });
  }

  function loadPendingDocs(ngoProfileId: string) {
    fetch(`/api/v1/ngo-profiles/${ngoProfileId}`)
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((body) => {
        const docs: PendingDocument[] = (body.data?.documents ?? []).filter(
          (d: { status: string }) => d.status === "pending"
        );
        setPendingDocsByNgo((prev) => ({ ...prev, [ngoProfileId]: docs.map((d) => ({ ...d, ngo_profile_id: ngoProfileId })) }));
      })
      .catch(() => {});
  }

  useEffect(load, [org.id]);

  async function reviewDocument(ngoProfileId: string, documentId: string, status: "verified" | "rejected") {
    setDocBusyId(documentId);
    try {
      const res = await fetch(`/api/v1/ngo-documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: org.id, status }),
      });
      if (res.ok) {
        setPendingDocsByNgo((prev) => ({
          ...prev,
          [ngoProfileId]: (prev[ngoProfileId] ?? []).filter((d) => d.id !== documentId),
        }));
      }
    } finally {
      setDocBusyId(null);
    }
  }

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/verification-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: org.id, status, reviewNotes: notesByRequest[id] || undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not update request");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update request");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Review queue</h1>
      <p className="mt-1 text-sm text-muted-foreground">Platform-wide NGO verification requests.</p>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {requests === null ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No pending verification requests.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-semibold">{r.ngo_name}</h2>
                <div className="flex items-center gap-2">
                  {r.status === "pending" &&
                    Date.now() - new Date(r.created_at).getTime() > 7 * 86_400_000 && (
                      <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-foreground">
                        Overdue
                      </span>
                    )}
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                    {r.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {r.status !== "approved" && r.status !== "rejected" && (
                <>
                  <Textarea
                    placeholder="Review notes (optional)"
                    className="mt-3"
                    rows={2}
                    value={notesByRequest[r.id] ?? ""}
                    onChange={(e) => setNotesByRequest((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => updateStatus(r.id, "in_review")}
                      >
                        {busyId === r.id && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                        Mark in review
                      </Button>
                    )}
                    <Button size="sm" disabled={busyId === r.id} onClick={() => updateStatus(r.id, "approved")}>
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => updateStatus(r.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </>
              )}
              {r.review_notes && (
                <p className="mt-3 text-sm text-muted-foreground">Notes: {r.review_notes}</p>
              )}

              {(pendingDocsByNgo[r.ngo_profile_id]?.length ?? 0) > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Pending documents
                  </p>
                  <ul className="mt-2 space-y-2">
                    {pendingDocsByNgo[r.ngo_profile_id].map((d) => (
                      <li key={d.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                        <span>{d.document_type}</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={docBusyId === d.id}
                            onClick={() => reviewDocument(r.ngo_profile_id, d.id, "verified")}
                          >
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={docBusyId === d.id}
                            onClick={() => reviewDocument(r.ngo_profile_id, d.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
