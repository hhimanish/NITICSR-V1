"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrg } from "@/components/dashboard/org-context";

type Policy = {
  id: string;
  title: string;
  category: string;
  status: string;
  version: number;
  acknowledgement_count: number;
};

type Decision = {
  id: string;
  decision_type: string;
  entity_type: string;
  rationale: string | null;
  decided_by_name: string | null;
  created_at: string;
};

type Delegation = {
  id: string;
  permission_key: string;
  ends_at: string;
  revoked_at: string | null;
  delegator_name: string | null;
  delegate_name: string | null;
};

type Member = { user_id: string; full_name: string | null; email: string };

const DELEGATABLE_PERMISSIONS = ["CSR.Project.Write", "CSR.Project.Approve", "Verification.Submit"];

export default function GovernancePage() {
  const org = useOrg();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  function loadPolicies() {
    fetch(`/api/v1/governance/policies?organizationId=${org.id}`)
      .then((r) => r.json())
      .then((b) => setPolicies(b.data ?? []));
  }
  function loadDelegations() {
    fetch(`/api/v1/delegations?organizationId=${org.id}`)
      .then((r) => r.json())
      .then((b) => setDelegations(b.data ?? []));
  }

  useEffect(() => {
    loadPolicies();
    fetch(`/api/v1/governance/decisions?organizationId=${org.id}`)
      .then((r) => r.json())
      .then((b) => setDecisions(b.data ?? []));
    loadDelegations();
    fetch(`/api/v1/organizations/${org.id}/members`)
      .then((r) => r.json())
      .then((b) => setMembers(b.data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id]);

  async function createPolicy(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/governance/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: org.id,
        title: form.get("title"),
        category: form.get("category") || undefined,
        content: form.get("content"),
      }),
    });
    if (res.ok) {
      e.currentTarget.reset();
      loadPolicies();
    }
  }

  async function publishPolicy(id: string) {
    await fetch(`/api/v1/governance/policies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    loadPolicies();
  }

  async function createDelegation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const days = Number(form.get("days") || 7);
    const endsAt = new Date(Date.now() + days * 86_400_000).toISOString();
    const res = await fetch("/api/v1/delegations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: org.id,
        delegateUserId: form.get("delegateUserId"),
        permissionKey: form.get("permissionKey"),
        endsAt,
      }),
    });
    if (res.ok) {
      e.currentTarget.reset();
      loadDelegations();
    }
  }

  async function revokeDelegation(id: string) {
    await fetch(`/api/v1/delegations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    loadDelegations();
  }

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Governance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Policies, delegated approval authority, and the immutable decision log for {org.name}.
        </p>
      </div>

      <section>
        <h2 className="font-heading text-lg font-semibold">Policies</h2>
        <div className="mt-3 space-y-2">
          {policies.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              <div>
                <span className="font-medium">{p.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {p.category} · v{p.version} · {p.acknowledgement_count} acknowledged
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                  {p.status}
                </span>
                {p.status === "draft" && (
                  <Button size="sm" variant="outline" onClick={() => publishPolicy(p.id)}>
                    Publish
                  </Button>
                )}
              </div>
            </div>
          ))}
          {policies.length === 0 && <p className="text-sm text-muted-foreground">No policies yet.</p>}
        </div>
        <form onSubmit={createPolicy} className="mt-3 space-y-2 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap gap-2">
            <Input name="title" placeholder="Policy title" required className="w-56" />
            <Input name="category" placeholder="Category (e.g. CSR)" className="w-40" />
          </div>
          <Textarea name="content" placeholder="Policy content" required rows={3} />
          <Button type="submit" size="sm" variant="outline">
            Add policy (draft)
          </Button>
        </form>
      </section>

      <section>
        <h2 className="font-heading text-lg font-semibold">Delegated approval authority</h2>
        <div className="mt-3 space-y-2">
          {delegations.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              <span>
                <span className="font-medium">{d.delegator_name ?? "—"}</span> delegated{" "}
                <span className="font-mono text-xs">{d.permission_key}</span> to{" "}
                <span className="font-medium">{d.delegate_name ?? "—"}</span> until{" "}
                {new Date(d.ends_at).toLocaleDateString("en-IN")}
              </span>
              {!d.revoked_at ? (
                <Button size="sm" variant="outline" onClick={() => revokeDelegation(d.id)}>
                  Revoke
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Revoked</span>
              )}
            </div>
          ))}
          {delegations.length === 0 && (
            <p className="text-sm text-muted-foreground">No delegations yet.</p>
          )}
        </div>
        <form onSubmit={createDelegation} className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-card p-4">
          <Select name="delegateUserId">
            <SelectTrigger className="w-56" aria-label="Delegate to">
              <SelectValue placeholder="Delegate to…" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.full_name ?? m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select name="permissionKey">
            <SelectTrigger className="w-56" aria-label="Permission">
              <SelectValue placeholder="Permission…" />
            </SelectTrigger>
            <SelectContent>
              {DELEGATABLE_PERMISSIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input name="days" type="number" min={1} defaultValue={7} className="w-24" aria-label="Days" />
          <Button type="submit" size="sm" variant="outline">
            Delegate
          </Button>
        </form>
      </section>

      <section>
        <h2 className="font-heading text-lg font-semibold">Decision log</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Immutable — every approval recorded here is append-only.
        </p>
        <div className="mt-3 space-y-2">
          {decisions.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{d.decision_type}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                By {d.decided_by_name ?? "—"}
                {d.rationale ? ` — ${d.rationale}` : ""}
              </p>
            </div>
          ))}
          {decisions.length === 0 && <p className="text-sm text-muted-foreground">No decisions recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}
